const { 
  createScheduledAudit, 
  getAllScheduledAudits, 
  updateScheduledAudit, 
  deleteScheduledAudit,
  executeAudit,
  getAuditExecutions,
  getAuditExecutionById,
  getAuditResults,
  updateScheduleNextRun
} = require('../models/database');

// Calculate next run time based on frequency
function calculateNextRun(frequency, scheduleTime, dayOfWeek = null, dayOfMonth = null) {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(':');
  
  let nextRun = new Date();
  nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (frequency === 'daily') {
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  } else if (frequency === 'weekly') {
    const currentDay = nextRun.getDay();
    let daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
    if (daysUntilNext === 0 && nextRun <= now) {
      daysUntilNext = 7;
    }
    nextRun.setDate(nextRun.getDate() + daysUntilNext);
  } else if (frequency === 'monthly') {
    nextRun.setDate(dayOfMonth);
    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
  }
  
  return nextRun;
}

// Create new scheduled audit
async function createSchedule(req, res) {
  try {
    const { schedule_name, frequency, schedule_time, day_of_week, day_of_month } = req.body;
    
    if (!schedule_name || !frequency || !schedule_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Schedule name, frequency, and time are required' 
      });
    }
    
    const nextRunAt = calculateNextRun(frequency, schedule_time, day_of_week, day_of_month);
    
    const schedule = await createScheduledAudit({
      schedule_name,
      frequency,
      schedule_time,
      day_of_week,
      day_of_month,
      created_by: req.user.userId,
      next_run_at: nextRunAt
    });
    
    res.json({ success: true, schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ success: false, message: 'Error creating schedule' });
  }
}

// Get all scheduled audits
async function getSchedules(req, res) {
  try {
    const schedules = await getAllScheduledAudits();
    res.json({ success: true, schedules });
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ success: false, message: 'Error loading schedules' });
  }
}

// Toggle schedule active status
async function toggleSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    const { is_active } = req.body;
    
    const schedule = await updateScheduledAudit(scheduleId, { is_active });
    res.json({ success: true, schedule });
  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({ success: false, message: 'Error updating schedule' });
  }
}

// Delete scheduled audit
async function deleteSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    await deleteScheduledAudit(scheduleId);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, message: 'Error deleting schedule' });
  }
}

// Execute audit manually
async function runAudit(req, res) {
  try {
    const { schedule_id, notes } = req.body;
    
    const execution = await executeAudit({
      schedule_id: schedule_id || null,
      execution_type: schedule_id ? 'scheduled' : 'manual',
      executed_by: req.user.userId,
      notes
    });
    
    // If this was a scheduled audit, update next run time
    if (schedule_id) {
      const schedules = await getAllScheduledAudits();
      const schedule = schedules.find(s => s.schedule_id === schedule_id);
      if (schedule) {
        const nextRun = calculateNextRun(
          schedule.frequency, 
          schedule.schedule_time, 
          schedule.day_of_week, 
          schedule.day_of_month
        );
        await updateScheduleNextRun(schedule_id, nextRun);
      }
    }
    
    res.json({ success: true, execution });
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({ success: false, message: 'Error executing audit' });
  }
}

// Get audit execution history
async function getExecutionHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const executions = await getAuditExecutions(limit);
    res.json({ success: true, executions });
  } catch (error) {
    console.error('Error getting execution history:', error);
    res.status(500).json({ success: false, message: 'Error loading history' });
  }
}

// Get specific audit execution details
async function getExecutionDetails(req, res) {
  try {
    const { executionId } = req.params;
    const execution = await getAuditExecutionById(executionId);
    const results = await getAuditResults(executionId);
    
    res.json({ success: true, execution, results });
  } catch (error) {
    console.error('Error getting execution details:', error);
    res.status(500).json({ success: false, message: 'Error loading details' });
  }
}

module.exports = {
  createSchedule,
  getSchedules,
  toggleSchedule,
  deleteSchedule,
  runAudit,
  getExecutionHistory,
  getExecutionDetails
};
