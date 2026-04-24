const { 
  getAnomalies, 
  getMissingAssets, 
  getOverdueAssets, 
  getUnusedAssets, 
  getSuspiciousPatterns 
} = require('../models/database');

async function getAnomaliesReport(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;
    const department = (userRole === 'Admin' || userRole === 'Viewer') ? null : userDepartment;

    console.log('Anomalies Report - User Role:', userRole, 'Department:', department);

    const anomalies = await getAnomalies(department);

    res.json({
      success: true,
      data: anomalies,
      department: (userRole === 'Admin' || userRole === 'Viewer') ? 'All Departments' : userDepartment
    });
  } catch (error) {
    console.error('Error getting anomalies report:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading anomalies: ' + error.message
    });
  }
}

async function getMissingAssetsController(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;
    const department = (userRole === 'Admin' || userRole === 'Viewer') ? null : userDepartment;

    const assets = await getMissingAssets(department);

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error getting missing assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading missing assets: ' + error.message
    });
  }
}

async function getOverdueAssetsController(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;
    const department = (userRole === 'Admin' || userRole === 'Viewer') ? null : userDepartment;

    const assets = await getOverdueAssets(department);

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error getting overdue assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading overdue assets: ' + error.message
    });
  }
}

async function getUnusedAssetsController(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;
    const department = (userRole === 'Admin' || userRole === 'Viewer') ? null : userDepartment;

    const assets = await getUnusedAssets(department);

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error getting unused assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading unused assets: ' + error.message
    });
  }
}

async function getSuspiciousPatternsController(req, res) {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;
    const department = (userRole === 'Admin' || userRole === 'Viewer') ? null : userDepartment;

    const patterns = await getSuspiciousPatterns(department);

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error getting suspicious patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading suspicious patterns: ' + error.message
    });
  }
}

module.exports = {
  getAnomaliesReport,
  getMissingAssetsController,
  getOverdueAssetsController,
  getUnusedAssetsController,
  getSuspiciousPatternsController
};
