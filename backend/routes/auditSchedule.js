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
// Create new schedule (Admin and Manager)
router.post('/schedules', checkRole(['Admin', 'Manager']), createSchedule);

// Get all schedules
router.get('/schedules', getSchedules);

// Toggle schedule active status (Admin and Manager)
router.patch('/schedules/:scheduleId/toggle', checkRole(['Admin', 'Manager']), toggleSchedule);

// Delete schedule (Admin and Manager)
router.delete('/schedules/:scheduleId', checkRole(['Admin', 'Manager']), deleteSchedule);

// Execute audit manually (Admin and Manager)
router.post('/execute', checkRole(['Admin', 'Manager']), runAudit);

// Get execution history
router.get('/executions', getExecutionHistory);

// Get specific execution details
router.get('/executions/:executionId', getExecutionDetails);

module.exports = router;
