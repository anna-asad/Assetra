const express = require('express');
const router = express.Router();
const { addAsset, getAssets, getAssetById, updateAsset, deleteAsset, changeAssetStatus, assignAsset, getAssetAssignment, getAllUsersForAssignment } = require('../controllers/assetController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticateToken);

// POST /api/assets - Create new asset (Admin and Manager)
router.post('/', roleCheck(['Admin', 'Manager']), addAsset);

// GET /api/assets - Get all assets
router.get('/', getAssets);

// GET /api/assets/users - Get all users for assignment dropdown
router.get('/users/list', getAllUsersForAssignment);

// GET /api/assets/:id - Get single asset for editing
router.get('/:id', getAssetById);

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
