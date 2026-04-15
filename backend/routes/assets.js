const express = require('express');
const router = express.Router();
const { addAsset, getAssets, getAssetById, updateAsset, deleteAsset, changeAssetStatus, assignAsset, getAssetAssignment, getAllUsersForAssignment, getAssetAuditLog, getAssetDepreciation, getDepreciationReport, getAssetHealth, updateHealthScores, getMaintenanceAlertsReport, getHealthReport, addMaintenanceRecord } = require('../controllers/assetController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticateToken);

// POST /api/assets - Create new asset (Admin and Manager)
router.post('/', roleCheck(['Admin', 'Manager']), addAsset);

// GET /api/assets - Get all assets
router.get('/', getAssets);

// GET /api/assets/depreciation/report - Get depreciation report
router.get('/depreciation/report', getDepreciationReport);

// GET /api/assets/health/report - Get health report
router.get('/health/report', getHealthReport);

// GET /api/assets/health/alerts - Get maintenance alerts
router.get('/health/alerts', getMaintenanceAlertsReport);

// POST /api/assets/health/update - Update all health scores
router.post('/health/update', roleCheck(['Admin']), updateHealthScores);

// GET /api/assets/users - Get all users for assignment dropdown
router.get('/users/list', getAllUsersForAssignment);

// GET /api/assets/:id - Get single asset for editing
router.get('/:id', getAssetById);

// GET /api/assets/:id/audit - Get audit log for asset
router.get('/:id/audit', getAssetAuditLog);

// GET /api/assets/:id/depreciation - Get depreciation for asset
router.get('/:id/depreciation', getAssetDepreciation);

// GET /api/assets/:id/health - Get health score for asset
router.get('/:id/health', getAssetHealth);

// POST /api/assets/:id/maintenance - Record maintenance
router.post('/:id/maintenance', roleCheck(['Admin', 'Manager']), addMaintenanceRecord);

// PATCH /api/assets/:id - Update asset (full edit)
router.patch('/:id', roleCheck(['Admin', 'Manager']), updateAsset);

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', roleCheck(['Admin']), deleteAsset);

// PATCH /api/assets/:id/status - Update asset status (Admin and Manager)
router.patch('/:id/status', roleCheck(['Admin', 'Manager']), changeAssetStatus);

// POST /api/assets/:id/assign - Assign asset to user/department
router.post('/:id/assign', roleCheck(['Admin', 'Manager']), assignAsset);

// GET /api/assets/:id/assignment - Get current assignment
router.get('/:id/assignment', getAssetAssignment);

module.exports = router;
