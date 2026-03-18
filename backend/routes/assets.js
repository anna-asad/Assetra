const express = require('express');
const router = express.Router();
const { addAsset, getAssets, getAssetById, updateAsset, deleteAsset, changeAssetStatus } = require('../controllers/assetController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticateToken);

// POST /api/assets - Create new asset (Admin and Manager)
router.post('/', roleCheck(['Admin', 'Manager']), addAsset);

// GET /api/assets - Get all assets
router.get('/', getAssets);

// GET /api/assets/:id - Get single asset for editing
router.get('/:id', getAssetById);

// PATCH /api/assets/:id - Update asset (full edit)
router.patch('/:id', roleCheck(['Admin', 'Manager']), updateAsset);

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', roleCheck(['Admin']), deleteAsset);

// PATCH /api/assets/:id/status - Update asset status (Admin and Manager)
router.patch('/:id/status', roleCheck(['Admin', 'Manager']), changeAssetStatus);

module.exports = router;
