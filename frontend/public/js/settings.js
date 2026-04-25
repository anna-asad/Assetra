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

// Load user management table
async function loadUsers() {
    try {
        const response = await fetch('/api/auth/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        const tbody = document.getElementById('usersTableBody');
        
        if (!data.success) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Failed to load users</td></tr>';
            return;
        }
        
        if (data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-text">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.users.map(u => {
            const roleClass = u.role.toLowerCase();
            const createdDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : '-';
            const isSelf = u.user_id === user.userId;
            const deleteBtn = isSelf 
                ? '<span style="color:#aaa;font-size:12px;">You</span>' 
                : `<button class="delete-btn" onclick="deleteUser(${u.user_id}, '${u.username}')">Delete</button>`;
            
            return `
                <tr>
                    <td>${u.user_id}</td>
                    <td>${u.username}</td>
                    <td>${u.full_name || '-'}</td>
                    <td>${u.email || '-'}</td>
                    <td><span class="role-badge ${roleClass}">${u.role}</span></td>
                    <td>${u.department || '-'}</td>
                    <td>${createdDate}</td>
                    <td>${deleteBtn}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="8" class="loading-text">Error loading users</td></tr>';
    }
}

// Delete user
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('User deleted successfully');
            loadUsers();
            loadUserStats();
            loadSystemStats();
        } else {
            alert('Error: ' + (data.message || 'Failed to delete user'));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

// Load stats on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSystemStats();
    loadUserStats();
    loadUsers();
});
