//Health Score = (Age Score × 40%) + (Maintenance Score × 40%) + (Warranty Score × 20%)
// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Display user name
document.getElementById('userName').textContent = user.fullName || user.username || 'User';

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/views/login.html';
    }
});

function goBack() {
    window.location.href = '/views/dashboard.html';
}

let reportData = null;

// Load depreciation report
async function loadReport() {
    const loadingMessage = document.getElementById('loadingMessage');
    const reportContent = document.getElementById('reportContent');
    
    loadingMessage.style.display = 'block';
    reportContent.style.display = 'none';
    
    try {
        const response = await fetch('/api/assets/depreciation/report', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            reportData = data;
            displayReport(data);
        } else {
            loadingMessage.textContent = 'Failed to load report';
        }
    } catch (error) {
        console.error('Error loading report:', error);
        loadingMessage.textContent = 'Failed to load report';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayReport(data) {
    const { summary, assets, department } = data;
    
    // Display department name
    document.getElementById('departmentName').textContent = department;
    
    // Display summary
    document.getElementById('totalAssets').innerHTML = `<i class="fas fa-boxes"></i> ${summary.total_assets}`;
    document.getElementById('totalPurchase').innerHTML = `<i class="fas fa-tags"></i> Rs.${summary.total_purchase_cost.toFixed(2)}`;
    document.getElementById('currentValue').innerHTML = `<i class="fas fa-wallet"></i> Rs.${summary.total_current_value.toFixed(2)}`;
    document.getElementById('totalDep').innerHTML = `<i class="fas fa-chart-line"></i> Rs.${summary.total_accumulated_depreciation.toFixed(2)}`;
    document.getElementById('totalSalvage').innerHTML = `<i class="fas fa-recycle"></i> Rs.${summary.total_salvage_value.toFixed(2)}`;
    document.getElementById('depRate').innerHTML = `<i class="fas fa-percentage"></i> ${summary.total_depreciation_percentage}%`;
    
    // Display assets table
    const tbody = document.getElementById('assetsTableBody');
    tbody.innerHTML = '';
    
    if (assets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No assets found</td></tr>';
    } else {
        assets.forEach(asset => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${asset.asset_tag}</td>
                <td>${asset.asset_name}</td>
                <td>${asset.department || '-'}</td>
                <td>Rs.${parseFloat(asset.purchase_cost).toFixed(2)}</td>
                <td>${asset.years_in_use} years</td>
                <td>Rs.${parseFloat(asset.annual_depreciation).toFixed(2)}</td>
                <td>Rs.${parseFloat(asset.accumulated_depreciation).toFixed(2)}</td>
                <td><strong>Rs.${parseFloat(asset.current_book_value).toFixed(2)}</strong></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    document.getElementById('reportContent').style.display = 'block';
}

// Function to export the report to CSV for accounting and valuation purposes
function exportToCSV() {
    if (!reportData || !reportData.assets) {
        alert('No data available to export. Please wait for the report to load.');
        return;
    }

    const { summary, assets, department } = reportData;
    
    // Build CSV content
    let csv = `Assetra Financial Report - ${department}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csv += `SUMMARY\n`;
    csv += `Total Assets,${summary.total_assets}\n`;
    csv += `Total Purchase Cost,${summary.total_purchase_cost.toFixed(2)}\n`;
    csv += `Current Book Value (Valuation),${summary.total_current_value.toFixed(2)}\n`;
    csv += `Total Accumulated Depreciation,${summary.total_accumulated_depreciation.toFixed(2)}\n`;
    csv += `Depreciation Rate,${summary.total_depreciation_percentage}%\n\n`;
    
    csv += `ASSET DETAILS\n`;
    csv += `Asset Tag,Asset Name,Department,Purchase Cost,Years in Use,Annual Depreciation,Accumulated Depreciation,Book Value (Valuation)\n`;
    
    assets.forEach(asset => {
        csv += `"${asset.asset_tag}","${asset.asset_name}","${asset.department || '-'}","${asset.purchase_cost}","${asset.years_in_use}","${asset.annual_depreciation}","${asset.accumulated_depreciation}","${asset.current_book_value}"\n`;
    });

    // Create blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const filename = `financial-report-${department.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to download the PDF version of the financial report
async function exportToPDF() {
    // Check if we have the report data loaded
    if (!reportData || !reportData.assets) {
        alert('No data available to export. Please wait for the report to load.');
        return;
    }

    try {
        // Create a simple text-based HTML for printing
        const { summary, assets, department } = reportData;
        
        // Build HTML content for printing
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Depreciation & Valuation Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; color: #333; }
                    h2 { color: #555; border-bottom: 2px solid #fa3bda; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #fa3bda; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                    .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                    .summary-card.highlight { background-color: #fff0f5; border-color: #fa3bda; }
                    .label { font-weight: bold; color: #555; }
                    .value { font-size: 1.2em; color: #333; }
                    .date { text-align: center; color: #888; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>ASSETRA - Depreciation & Valuation Report</h1>
                <p class="date">Department: ${department} | Generated: ${new Date().toLocaleString()}</p>
                
                <h2>Financial Summary</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">Total Assets</div>
                        <div class="value">${summary.total_assets}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Purchase Cost</div>
                        <div class="value">Rs.${summary.total_purchase_cost.toFixed(2)}</div>
                    </div>
                    <div class="summary-card highlight">
                        <div class="label">Current Total Value</div>
                        <div class="value">Rs.${summary.total_current_value.toFixed(2)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Depreciation</div>
                        <div class="value">Rs.${summary.total_accumulated_depreciation.toFixed(2)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Salvage Value</div>
                        <div class="value">Rs.${summary.total_salvage_value.toFixed(2)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Depreciation Rate</div>
                        <div class="value">${summary.total_depreciation_percentage}%</div>
                    </div>
                </div>
                
                <h2>Asset Depreciation Details</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Asset Tag</th>
                            <th>Asset Name</th>
                            <th>Department</th>
                            <th>Purchase Cost</th>
                            <th>Years in Use</th>
                            <th>Annual Dep.</th>
                            <th>Accum. Dep.</th>
                            <th>Current Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assets.map(asset => `
                            <tr>
                                <td>${asset.asset_tag}</td>
                                <td>${asset.asset_name}</td>
                                <td>${asset.department || '-'}</td>
                                <td>Rs.${parseFloat(asset.purchase_cost).toFixed(2)}</td>
                                <td>${asset.years_in_use} years</td>
                                <td>Rs.${parseFloat(asset.annual_depreciation).toFixed(2)}</td>
                                <td>Rs.${parseFloat(asset.accumulated_depreciation).toFixed(2)}</td>
                                <td><strong>Rs.${parseFloat(asset.current_book_value).toFixed(2)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Open print dialog in new window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Error generating PDF report. Please try again.');
    }
}

// Load report on page load
window.addEventListener('DOMContentLoaded', () => {
    loadReport();

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    const pdfBtn = document.getElementById('pdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', exportToPDF);
    }
});
