const express = require('express');
const router = express.Router();
const { generatePDFReport, generateExcelReport, getDepartments } = require('../controllers/reportController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticateToken);

// GET /api/reports/departments - Get list of departments for filter
router.get('/departments', getDepartments);

// GET /api/reports/pdf - Generate PDF report
router.get('/pdf', roleCheck(['Admin', 'Manager']), generatePDFReport);

// GET /api/reports/excel - Generate Excel report
router.get('/excel', roleCheck(['Admin', 'Manager']), generateExcelReport);

module.exports = router;
