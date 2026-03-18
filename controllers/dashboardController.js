const { getTotalAssets, getAssetsByStatus, getTotalAssetsByDepartment, getAssetsByStatusAndDepartment, getTotalAssetValue, getMaintenanceCost, getDepreciation, getAuditedCount, getMaintainedCount, getComplianceScore } = require('../models/database');

async function getDashboardStats(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

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

    const statusBreakdown = {
      Available: 0,
      Allocated: 0,
      Maintenance: 0,
      Missing: 0
    };

    assetsByStatus.forEach(item => {
      statusBreakdown[item.status] = item.count;
    });

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


module.exports = {
  getDashboardStats
};
