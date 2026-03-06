const { getTotalAssets, getAssetsByStatus } = require('../models/assetModel');
const { getTotalUsers } = require('../models/userModel');

async function getDashboardStats(req, res) {
  try {
    const [totalAssets, totalUsers, assetsByStatus] = await Promise.all([
      getTotalAssets(),
      getTotalUsers(),
      getAssetsByStatus()
    ]);

    // Format status breakdown
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
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve dashboard statistics' 
    });
  }
}

module.exports = {
  getDashboardStats
};
