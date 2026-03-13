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

// Fetch dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const stats = data.stats;

            // Show department info for Managers
            const departmentInfo = document.getElementById('departmentInfo');
            if (stats.department && stats.department !== 'All Departments') {
                departmentInfo.textContent = `Viewing: ${stats.department} Department`;
                departmentInfo.style.display = 'block';
            }

            // Update stat cards
            document.getElementById('totalAssets').textContent = stats.totalAssets || 0;
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('missingAssets').textContent = stats.statusBreakdown.Missing || 0;
            document.getElementById('maintenanceAssets').textContent = stats.statusBreakdown.Maintenance || 0;

            // Update bar chart
            document.getElementById('availableCount').textContent = stats.statusBreakdown.Available || 0;
            document.getElementById('allocatedCount').textContent = stats.statusBreakdown.Allocated || 0;
            document.getElementById('maintenanceCount').textContent = stats.statusBreakdown.Maintenance || 0;
            document.getElementById('missingCount').textContent = stats.statusBreakdown.Missing || 0;

            // Update bar heights based on values
            updateBarHeights(stats.statusBreakdown);
        } else {
            console.error('Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/views/login.html';
        }
    }
}

function updateBarHeights(statusBreakdown) {
    const maxValue = Math.max(
        statusBreakdown.Available || 0,
        statusBreakdown.Allocated || 0,
        statusBreakdown.Maintenance || 0,
        statusBreakdown.Missing || 0,
        1 // Minimum 1 to avoid division by zero
    );

    const bars = document.querySelectorAll('.bar');
    const values = [
        statusBreakdown.Available || 0,
        statusBreakdown.Allocated || 0,
        statusBreakdown.Maintenance || 0,
        statusBreakdown.Missing || 0
    ];

    bars.forEach((bar, index) => {
        const percentage = (values[index] / maxValue) * 100;
        bar.style.height = Math.max(percentage, 20) + '%'; // Minimum 20% height for visibility
    });
}

// Load dashboard data on page load
window.addEventListener('DOMContentLoaded', loadDashboardStats);
