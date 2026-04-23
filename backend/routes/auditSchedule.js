const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const {
  createSchedule,
  getSchedules,
  toggleSchedule,
  deleteSchedule,
  runAudit,
  getExecutionHistory,
  getExecutionDetails
} = require('../controllers/auditScheduleController');



// All routes require authentication
router.use(authenticateToken);  
// Create new schedule (Admin only)
router.post('/schedules', checkRole(['Admin']), createSchedule);

// Get all schedules
router.get('/schedules', getSchedules);

// Toggle schedule active status (Admin only)
router.patch('/schedules/:scheduleId/toggle', checkRole(['Admin']), toggleSchedule);

// Delete schedule (Admin only)
router.delete('/schedules/:scheduleId', checkRole(['Admin']), deleteSchedule);

// Execute audit manually (Admin only)
router.post('/execute', checkRole(['Admin']), runAudit);

// Get execution history
router.get('/executions', getExecutionHistory);

// Get specific execution details
router.get('/executions/:executionId', getExecutionDetails);

module.exports = router;
