const db = require('../models/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Helper function to format date
function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Helper function to format currency
function formatCurrency(amount) {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Generate PDF Report
async function generatePDFReport(req, res) {
  try {
    const { department, startDate, endDate } = req.query;
    
    // Validate and parse dates
    const filters = {
      department: department || null
    };
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
      // Set end date to end of day
      filters.endDate.setHours(23, 59, 59, 999);
    }
    
    // Fetch assets with audit trail
    const assets = await db.getAssetsWithAuditTrail(filters);
    
    if (!assets || assets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No assets found for the specified filters' 
      });
    }
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 40 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="asset-report-${new Date().getTime()}.pdf"`
    );
    
    // Pipe document to response
    doc.pipe(res);
    
    // Add title
    doc.fontSize(20).font('Helvetica-Bold').text('Asset Management Report', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Add filters summary
    doc.fontSize(11).font('Helvetica-Bold').text('\nReport Filters:', { underline: true });
    doc.fontSize(10).font('Helvetica');
    if (filters.department) doc.text(`Department: ${filters.department}`);
    if (filters.startDate) doc.text(`Start Date: ${formatDate(filters.startDate)}`);
    if (filters.endDate) doc.text(`End Date: ${formatDate(filters.endDate)}`);
    doc.text(`Total Assets: ${assets.length}`);
    
    // Add summary statistics
    doc.fontSize(11).font('Helvetica-Bold').text('\nSummary Statistics:', { underline: true });
    doc.fontSize(10).font('Helvetica');
    
    const totalValue = assets.reduce((sum, a) => sum + (parseFloat(a.purchase_cost) || 0), 0);
    const statusCounts = {};
    assets.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    
    doc.text(`Total Asset Value: ${formatCurrency(totalValue)}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status}: ${count} assets`);
    });
    
    // Add assets table
    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('Asset Details', { underline: true });
    
    assets.forEach((asset, index) => {
      if (index > 0 && index % 3 === 0) {
        doc.addPage();
      }
      
      doc.fontSize(10).font('Helvetica-Bold').text(`\nAsset #${index + 1}: ${asset.asset_name}`, { 
        fill: false 
      });
      doc.fontSize(9).font('Helvetica');
      
      const details = [
        `Tag: ${asset.asset_tag}`,
        `Category: ${asset.category}`,
        `Status: ${asset.status}`,
        `Department: ${asset.department || 'N/A'}`,
        `Location: ${asset.location || 'N/A'}`,
        `Purchase Date: ${formatDate(asset.purchase_date)}`,
        `Purchase Cost: ${formatCurrency(asset.purchase_cost)}`,
        `Description: ${asset.description || 'N/A'}`,
        `Health Score: ${asset.health_score || 'N/A'}`,
        `Created By: ${asset.created_by_name || 'N/A'}`,
        `Created At: ${formatDate(asset.created_at)}`
      ];
      
      details.forEach(detail => {
        doc.text(`  • ${detail}`);
      });
      
      // Add audit trail for this asset
      if (asset.audit_logs && asset.audit_logs.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('  Audit Trail:', { margin: [5, 0, 0, 0] });
        
        asset.audit_logs.slice(0, 5).forEach(log => {
          doc.fontSize(8).font('Helvetica').text(
            `    - ${log.action} by ${log.user_name} on ${formatDate(log.timestamp)}: ${log.details || 'N/A'}`,
            { width: 400, align: 'left' }
          );
        });
        
        if (asset.audit_logs.length > 5) {
          doc.text(`    ... and ${asset.audit_logs.length - 5} more modifications`, { color: '#666666' });
        }
      }
    });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Generate Excel Report
async function generateExcelReport(req, res) {
  try {
    const { department, startDate, endDate } = req.query;
    
    // Validate and parse dates
    const filters = {
      department: department || null
    };
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
      filters.endDate.setHours(23, 59, 59, 999);
    }
    
    // Fetch assets with audit trail
    const assets = await db.getAssetsWithAuditTrail(filters);
    
    if (!assets || assets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No assets found for the specified filters' 
      });
    }
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // ===== ASSETS SHEET =====
    const assetsSheet = workbook.addWorksheet('Assets');
    
    // Set column widths
    assetsSheet.columns = [
      { header: 'Asset Tag', key: 'asset_tag', width: 15 },
      { header: 'Asset Name', key: 'asset_name', width: 20 },
      { header: 'Category', key: 'category', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Location', key: 'location', width: 15 },
      { header: 'Purchase Date', key: 'purchase_date', width: 12 },
      { header: 'Purchase Cost', key: 'purchase_cost', width: 12 },
      { header: 'Health Score', key: 'health_score', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created By', key: 'created_by_name', width: 15 },
      { header: 'Created At', key: 'created_at', width: 15 }
    ];
    
    // Style header row
    assetsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    assetsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    
    // Add asset data
    assets.forEach(asset => {
      assetsSheet.addRow({
        asset_tag: asset.asset_tag,
        asset_name: asset.asset_name,
        category: asset.category,
        status: asset.status,
        department: asset.department || 'N/A',
        location: asset.location || 'N/A',
        purchase_date: formatDate(asset.purchase_date),
        purchase_cost: formatCurrency(asset.purchase_cost),
        health_score: asset.health_score || 'N/A',
        created_by_name: asset.created_by_name || 'N/A',
        created_at: formatDate(asset.created_at)
      });
    });
    
    // ===== AUDIT TRAIL SHEET =====
    const auditSheet = workbook.addWorksheet('Audit Trail');
    
    auditSheet.columns = [
      { header: 'Asset Tag', key: 'asset_tag', width: 15 },
      { header: 'Asset Name', key: 'asset_name', width: 20 },
      { header: 'Action', key: 'action', width: 15 },
      { header: 'User', key: 'user_name', width: 15 },
      { header: 'Details', key: 'details', width: 30 },
      { header: 'Timestamp', key: 'timestamp', width: 18 }
    ];
    
    // Style header row
    auditSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    auditSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    
    // Add audit trail data
    assets.forEach(asset => {
      if (asset.audit_logs && asset.audit_logs.length > 0) {
        asset.audit_logs.forEach(log => {
          auditSheet.addRow({
            asset_tag: asset.asset_tag,
            asset_name: asset.asset_name,
            action: log.action,
            user_name: log.user_name || 'N/A',
            details: log.details || 'N/A',
            timestamp: formatDate(log.timestamp)
          });
        });
      }
    });
    
    // ===== SUMMARY SHEET =====
    const summarySheet = workbook.addWorksheet('Summary');
    
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    
    // Style header row
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    
    // Calculate summary statistics
    const totalValue = assets.reduce((sum, a) => sum + (parseFloat(a.purchase_cost) || 0), 0);
    const statusCounts = {};
    assets.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    
    // Add summary data
    summarySheet.addRow({ metric: 'Report Generated', value: new Date().toLocaleString() });
    summarySheet.addRow({ metric: 'Total Assets', value: assets.length });
    summarySheet.addRow({ metric: 'Total Asset Value', value: formatCurrency(totalValue) });
    summarySheet.addRow({ metric: 'Filter - Department', value: filters.department || 'All' });
    summarySheet.addRow({ metric: 'Filter - Start Date', value: filters.startDate ? formatDate(filters.startDate) : 'N/A' });
    summarySheet.addRow({ metric: 'Filter - End Date', value: filters.endDate ? formatDate(filters.endDate) : 'N/A' });
    
    summarySheet.addRow({ metric: '', value: '' }); // Blank row
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      summarySheet.addRow({ metric: `${status} Assets`, value: count });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="asset-report-${new Date().getTime()}.xlsx"`
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get unique departments for filter
async function getDepartments(req, res) {
  try {
    const departments = await db.getUniqueDepartments();
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  generatePDFReport,
  generateExcelReport,
  getDepartments
};
