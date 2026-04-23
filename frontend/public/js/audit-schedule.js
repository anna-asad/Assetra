// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

document.getElementById('userName').textContent = user.fullName || user.username || 'User';

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/views/login.html';
    }
});

// Modal controls
const createModal = document.getElementById('createScheduleModal');
const detailsModal = document.getElementById('auditDetailsModal');

document.getElementById('createScheduleBtn').addEventListener('click', () => {
    createModal.style.display = 'flex';
});

document.getElementById('closeCreateModal').addEventListener('click', () => {
    createModal.style.display = 'none';
});

document.getElementById('cancelCreateBtn').addEventListener('click', () => {
    createModal.style.display = 'none';
});

document.getElementById('closeDetailsModal').addEventListener('click', () => {
    detailsModal.style.display = 'none';
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === createModal) createModal.style.display = 'none';
    if (e.target === detailsModal) detailsModal.style.display = 'none';
});

// Frequency change handler
document.getElementById('frequency').addEventListener('change', (e) => {
    const frequency = e.target.value;
    const dayOfWeekGroup = document.getElementById('dayOfWeekGroup');
    const dayOfMonthGroup = document.getElementById('dayOfMonthGroup');
    
    dayOfWeekGroup.style.display = frequency === 'weekly' ? 'block' : 'none';
    dayOfMonthGroup.style.display = frequency === 'monthly' ? 'block' : 'none';
});

// Create schedule form
document.getElementById('createScheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        schedule_name: document.getElementById('scheduleName').value,
        frequency: document.getElementById('frequency').value,
        schedule_time: document.getElementById('scheduleTime').value,
        day_of_week: document.getElementById('frequency').value === 'weekly' ? 
            parseInt(document.getElementById('dayOfWeek').value) : null,
        day_of_month: document.getElementById('frequency').value === 'monthly' ? 
            parseInt(document.getElementById('dayOfMonth').value) : null
    };
    
    try {
        const response = await fetch('/api/audit-schedule/schedules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Schedule created successfully!');
            createModal.style.display = 'none';
            document.getElementById('createScheduleForm').reset();
            loadSchedules();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error creating schedule:', error);
        alert('Failed to create schedule');
    }
});

// Run manual audit
document.getElementById('runManualAuditBtn').addEventListener('click', async () => {
    if (!confirm('Run a manual audit now? This will scan all assets.')) return;
    
    try {
        const response = await fetch('/api/audit-schedule/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notes: 'Manual audit execution' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Audit completed successfully!');
            loadHistory();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error running audit:', error);
        alert('Failed to run audit');
    }
});

// Load schedules
async function loadSchedules() {
    const loading = document.getElementById('schedulesLoading');
    const error = document.getElementById('schedulesError');
    const container = document.getElementById('schedulesContainer');
    const noData = document.getElementById('noSchedules');
    const tbody = document.getElementById('schedulesTableBody');
    
    loading.style.display = 'block';
    error.style.display = 'none';
    container.style.display = 'none';
    noData.style.display = 'none';
    
    try {
        const response = await fetch('/api/audit-schedule/schedules', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.schedules.length === 0) {
                noData.style.display = 'block';
            } else {
                tbody.innerHTML = '';
                data.schedules.forEach(schedule => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${schedule.schedule_name}</td>
                        <td><span class="badge">${schedule.frequency}</span></td>
                        <td>${formatTime(schedule.schedule_time)}</td>
                        <td>${schedule.next_run_at ? formatDateTime(schedule.next_run_at) : '-'}</td>
                        <td>${schedule.last_run_at ? formatDateTime(schedule.last_run_at) : 'Never'}</td>
                        <td>
                            <span class="status-badge ${schedule.is_active ? 'status-active' : 'status-inactive'}">
                                ${schedule.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <button class="btn-icon" onclick="toggleSchedule(${schedule.schedule_id}, ${!schedule.is_active})" 
                                    title="${schedule.is_active ? 'Deactivate' : 'Activate'}">
                                ${schedule.is_active ? '⏸' : '▶'}
                            </button>
                            <button class="btn-icon btn-danger" onclick="deleteSchedule(${schedule.schedule_id})" title="Delete">
                                🗑
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                container.style.display = 'block';
            }
        } else {
            error.textContent = data.message;
            error.style.display = 'block';
        }
    } catch (err) {
        console.error('Error loading schedules:', err);
        error.textContent = 'Failed to load schedules';
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Load history
async function loadHistory() {
    const loading = document.getElementById('historyLoading');
    const error = document.getElementById('historyError');
    const container = document.getElementById('historyContainer');
    const noData = document.getElementById('noHistory');
    const tbody = document.getElementById('historyTableBody');
    
    loading.style.display = 'block';
    error.style.display = 'none';
    container.style.display = 'none';
    noData.style.display = 'none';
    
    try {
        const response = await fetch('/api/audit-schedule/executions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.executions.length === 0) {
                noData.style.display = 'block';
            } else {
                tbody.innerHTML = '';
                data.executions.forEach(exec => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDateTime(exec.executed_at)}</td>
                        <td><span class="badge">${exec.execution_type}</span></td>
                        <td>${exec.total_assets}</td>
                        <td><span class="badge-red">${exec.missing_count}</span></td>
                        <td><span class="badge-yellow">${exec.overdue_maintenance_count}</span></td>
                        <td>${exec.executed_by_name}</td>
                        <td>
                            <button class="btn-small" onclick="viewAuditDetails(${exec.execution_id})">
                                View Details
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                container.style.display = 'block';
            }
        } else {
            error.textContent = data.message;
            error.style.display = 'block';
        }
    } catch (err) {
        console.error('Error loading history:', err);
        error.textContent = 'Failed to load history';
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Toggle schedule
async function toggleSchedule(scheduleId, isActive) {
    try {
        const response = await fetch(`/api/audit-schedule/schedules/${scheduleId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_active: isActive })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadSchedules();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error toggling schedule:', error);
        alert('Failed to update schedule');
    }
}

// Delete schedule
async function deleteSchedule(scheduleId) {
    if (!confirm('Delete this schedule? This cannot be undone.')) return;
    
    try {
        const response = await fetch(`/api/audit-schedule/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadSchedules();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule');
    }
}

// View audit details
async function viewAuditDetails(executionId) {
    const modal = document.getElementById('auditDetailsModal');
    const loading = document.getElementById('detailsLoading');
    const content = document.getElementById('detailsContent');
    
    modal.style.display = 'flex';
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        const response = await fetch(`/api/audit-schedule/executions/${executionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('detailExecutedAt').textContent = formatDateTime(data.execution.executed_at);
            document.getElementById('detailExecutedBy').textContent = data.execution.executed_by_name;
            document.getElementById('detailTotalAssets').textContent = data.execution.total_assets;
            document.getElementById('detailMissing').textContent = data.execution.missing_count;
            document.getElementById('detailOverdue').textContent = data.execution.overdue_maintenance_count;
            
            const tbody = document.getElementById('detailsTableBody');
            tbody.innerHTML = '';
            
            data.results.forEach(result => {
                const issues = [];
                if (result.is_missing) issues.push('Missing');
                if (result.is_overdue_maintenance) issues.push('Overdue Maintenance');
                if (result.health_score < 50) issues.push('Low Health');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${result.asset_tag}</td>
                    <td>${result.asset_name}</td>
                    <td><span class="status-badge status-${result.status.toLowerCase()}">${result.status}</span></td>
                    <td>${result.department}</td>
                    <td>
                        <span class="health-badge health-${result.health_score >= 70 ? 'good' : result.health_score >= 50 ? 'warning' : 'critical'}">
                            ${result.health_score || 'N/A'}
                        </span>
                    </td>
                    <td>${issues.length > 0 ? issues.join(', ') : 'None'}</td>
                `;
                tbody.appendChild(row);
            });
            
            content.style.display = 'block';
        } else {
            alert('Error: ' + data.message);
            modal.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading details:', error);
        alert('Failed to load details');
        modal.style.display = 'none';
    } finally {
        loading.style.display = 'none';
    }
}

// Utility functions
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(timeString) {
    if (!timeString) return '-';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Load data on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSchedules();
    loadHistory();
});
