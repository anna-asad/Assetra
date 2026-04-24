const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAnomaliesReport,
  getMissingAssetsController,
  getOverdueAssetsController,
  getUnusedAssetsController,
  getSuspiciousPatternsController
} = require('../controllers/anomalyController');

// Get all anomalies (summary)
router.get('/report', auth, getAnomaliesReport);

// Get specific anomaly types
router.get('/missing', auth, getMissingAssetsController);
router.get('/overdue', auth, getOverdueAssetsController);
router.get('/unused', auth, getUnusedAssetsController);
router.get('/patterns', auth, getSuspiciousPatternsController);

module.exports = router;
