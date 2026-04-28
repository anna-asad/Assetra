const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getAnomaliesReport,
  getMissingAssetsController,
  getOverdueAssetsController,
  getUnusedAssetsController,
  getSuspiciousPatternsController
} = require('../controllers/anomalyController');

// Get all anomalies (summary) - Admin and Manager only
router.get('/report', auth, roleCheck(['Admin', 'Manager']), getAnomaliesReport);

// Get specific anomaly types - Admin and Manager only
router.get('/missing', auth, roleCheck(['Admin', 'Manager']), getMissingAssetsController);
router.get('/overdue', auth, roleCheck(['Admin', 'Manager']), getOverdueAssetsController);
router.get('/unused', auth, roleCheck(['Admin', 'Manager']), getUnusedAssetsController);
router.get('/patterns', auth, roleCheck(['Admin', 'Manager']), getSuspiciousPatternsController);

module.exports = router;
