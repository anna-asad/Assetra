// Check if user is logged in and is Admin
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Check if user is Admin
if (user.role !== 'Admin') {
    alert('Access Denied: Admin only');
    window.location.href = '/views/dashboard.html';
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

// Load system statistics
async function loadSystemStats() {
    try {
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.totalUsers || 0;
            document.getElementById('totalAssets').textContent = data.stats.totalAssets || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load user role breakdown
async function loadUserStats() {
    try {
        const response = await fetch('/api/auth/users/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('adminCount').textContent = data.counts.Admin || 0;
            document.getElementById('managerCount').textContent = data.counts.Manager || 0;
            document.getElementById('viewerCount').textContent = data.counts.Viewer || 0;
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Load stats on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSystemStats();
    loadUserStats();
});
