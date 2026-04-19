const express = require('express');
const router = express.Router();
const { getDashboardStats, getAssetDistribution } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

// GET /api/dashboard/asset-distribution (Admin only)
router.get('/asset-distribution', roleCheck(['Admin']), getAssetDistribution);

module.exports = router;
