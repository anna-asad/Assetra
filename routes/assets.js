const express = require('express');
const router = express.Router();
const { addAsset, getAssets, changeAssetStatus } = require('../controllers/assetController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticateToken);

// POST /api/assets - Create new asset (Admin and Manager)
router.post('/', roleCheck(['Admin', 'Manager']), addAsset);

// GET /api/assets - Get all assets
router.get('/', getAssets);

// PATCH /api/assets/:id/status - Update asset status (Admin and Manager)
router.patch('/:id/status', roleCheck(['Admin', 'Manager']), changeAssetStatus);

module.exports = router;
