const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

module.exports = router;
