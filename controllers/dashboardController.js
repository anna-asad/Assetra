const { getTotalAssets, getAssetsByStatus, getTotalAssetsByDepartment, getAssetsByStatusAndDepartment, getTotalUsers } = require('../models/database');

async function getDashboardStats(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    let totalAssets, assetsByStatus;

    if (userRole === 'Manager') {
      totalAssets = await getTotalAssetsByDepartment(userDepartment);
      assetsByStatus = await getAssetsByStatusAndDepartment(userDepartment);
    } else {
      totalAssets = await getTotalAssets();
      assetsByStatus = await getAssetsByStatus();
    }

    const totalUsers = await getTotalUsers();

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
        totalUsers,
        statusBreakdown,
        department: userRole === 'Manager' ? userDepartment : 'All Departments'
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
