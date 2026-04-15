// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Display user name
document.getElementById('userName').textContent = user.fullName || user.username || 'User';

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/views/login.html';
    }
});

function goBack() {
    window.location.href = '/views/dashboard.html';
}

// Update health scores for all assets
async function updateHealthScores() {
    if (!confirm('This will recalculate health scores for all assets. Continue?')) return;
    
    try {
        const response = await fetch('/api/assets/health/update', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            loadAlerts(); // Reload alerts
        } else {
            alert('Failed to update health scores');
        }
    } catch (error) {
        console.error('Error updating health scores:', error);
        alert('Failed to update health scores');
    }
}

// Load maintenance alerts
async function loadAlerts() {
    const loadingMessage = document.getElementById('loadingMessage');
    const alertsContent = document.getElementById('alertsContent');
    
    loadingMessage.style.display = 'block';
    alertsContent.style.display = 'none';
    
    try {
        const response = await fetch('/api/assets/health/alerts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAlerts(data.alerts);
        } else {
            loadingMessage.textContent = 'Failed to load alerts';
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
        loadingMessage.textContent = 'Failed to load alerts';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayAlerts(alerts) {
    const alertsContent = document.getElementById('alertsContent');
    const noAlerts = document.getElementById('noAlerts');
    const alertsTable = document.getElementById('alertsTable');
    const tbody = document.getElementById('alertsTableBody');
    
    // Count alerts by severity
    let criticalCount = 0;
    let warningCount = 0;
    
    alerts.forEach(alert => {
        if (alert.alert_reason.includes('Critical')) {
            criticalCount++;
        } else if (alert.alert_reason.includes('Warning')) {
            warningCount++;
        }
    });
    
    document.getElementById('criticalCount').textContent = criticalCount;
    document.getElementById('warningCount').textContent = warningCount;
    
    // Display alerts table
    if (alerts.length === 0) {
        noAlerts.style.display = 'block';
        alertsTable.style.display = 'none';
    } else {
        noAlerts.style.display = 'none';
        tbody.innerHTML = '';
        
        alerts.forEach(alert => {
            const isCritical = alert.alert_reason.includes('Critical');
            const row = document.createElement('tr');
            row.className = isCritical ? 'critical-row' : 'warning-row';
            
            const priorityBadge = isCritical ? 
                '<span class="priority-badge priority-critical">CRITICAL</span>' :
                '<span class="priority-badge priority-warning">WARNING</span>';
            
            const healthBadge = alert.health_score < 50 ?
                `<span class="health-score health-critical">${alert.health_score}</span>` :
                `<span class="health-score health-warning">${alert.health_score}</span>`;
            
            const warrantyDate = alert.warranty_expiry_date ? 
                new Date(alert.warranty_expiry_date).toLocaleDateString() : 'N/A';
            
            const lastMaintenance = alert.last_maintenance_date ?
                new Date(alert.last_maintenance_date).toLocaleDateString() : 'Never';
            
            row.innerHTML = `
                <td>${priorityBadge}</td>
                <td>${alert.asset_tag}</td>
                <td>${alert.asset_name}</td>
                <td>${alert.department || '-'}</td>
                <td>${healthBadge}</td>
                <td>${alert.alert_reason}</td>
                <td>${warrantyDate}</td>
                <td>${lastMaintenance}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        alertsTable.style.display = 'block';
    }
    
    alertsContent.style.display = 'block';
}

// Load alerts on page load
window.addEventListener('DOMContentLoaded', () => {
    loadAlerts();
});
