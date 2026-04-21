const { getTotalAssets, getAssetsByStatus, getTotalAssetsByDepartment, getAssetsByStatusAndDepartment, getTotalAssetValue, getMaintenanceCost, getDepreciation, getAuditedCount, getMaintainedCount, getComplianceScore, getUniqueDepartments, getAssetsByValue } = require('../models/database');

async function getDashboardStats(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    console.log('Dashboard Stats - User Role:', userRole, 'Department:', userDepartment);

    let totalAssets, assetsByStatus, maintenanceCost, depreciation, auditedCount, maintainedCount, complianceScore, totalAssetValue;

    if (userRole === 'Admin' || userRole === 'Viewer') {
      totalAssets = await getTotalAssets();
      assetsByStatus = await getAssetsByStatus();
      maintenanceCost = await getMaintenanceCost();
      auditedCount = await getAuditedCount();
      maintainedCount = await getMaintainedCount();
      complianceScore = await getComplianceScore();
      totalAssetValue = await getTotalAssetValue();
    } else if (userRole === 'Manager') {
      totalAssets = await getTotalAssetsByDepartment(userDepartment);
      assetsByStatus = await getAssetsByStatusAndDepartment(userDepartment);
      maintenanceCost = await getMaintenanceCost(userDepartment);
      auditedCount = await getAuditedCount(userDepartment);
      maintainedCount = await getMaintainedCount(userDepartment);
      complianceScore = await getComplianceScore(userDepartment);
      totalAssetValue = await getTotalAssetValue(userDepartment);
    }

    console.log('Assets by status:', assetsByStatus);

    const statusBreakdown = {
      Available: 0,
      Allocated: 0,
      Maintenance: 0,
      Missing: 0
    };

    assetsByStatus.forEach(item => {
      statusBreakdown[item.status] = item.count;
    });

    console.log('Status breakdown:', statusBreakdown);

    res.json({
      success: true,
      stats: {
        totalAssets,
        totalAssetValue,
        statusBreakdown,
        maintenanceCost,
        depreciation,
        auditedCount,
        maintainedCount,
        complianceScore,
        department: (userRole === 'Admin' || userRole === 'Viewer') ? 'All Departments' : userDepartment
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading dashboard: ' + error.message 
    });
  }
}

async function getAssetDistribution(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    let distribution = [];

    if (userRole === 'Manager') {
      // Managers see only their department
      const statusData = await getAssetsByStatusAndDepartment(userDepartment);
      const breakdown = {
        Available: 0,
        Allocated: 0,
        Maintenance: 0,
        Missing: 0
      };
      statusData.forEach(item => {
        breakdown[item.status] = item.count;
      });
      breakdown.total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
      distribution = [{ department: userDepartment, ...breakdown }];
    } else {
      // Admin sees all departments
      const departments = await getUniqueDepartments();
      for (const department of departments) {
        const statusData = await getAssetsByStatusAndDepartment(department);
        const breakdown = {
          Available: 0,
          Allocated: 0,
          Maintenance: 0,
          Missing: 0
        };
        statusData.forEach(item => {
          breakdown[item.status] = item.count;
        });
        breakdown.total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
        distribution.push({ department, ...breakdown });
      }
    }

    res.json({
      success: true,
      distribution,
      userRole // For frontend debugging
    });
  } catch (error) {
    console.error('Error getting asset distribution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading asset distribution: ' + error.message 
    });
  }
}

async function getAssetsByValueController(req, res) {
  try {
    const { role, department } = req.user;
    const deptFilter = (role === 'Admin' || role === 'Viewer') ? null : department;
    const assets = await getAssetsByValue(deptFilter);
    res.json({ success: true, assets });
  } catch (error) {
    console.error('Error getting assets by value:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading assets: ' + error.message 
    });
  }
}

module.exports = {
  getDashboardStats,
  getAssetDistribution,
  getAssetsByValueController
};
