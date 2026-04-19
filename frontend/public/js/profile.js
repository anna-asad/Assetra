// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Display user name in header
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

// Load profile data
function loadProfile() {
    // Get initials for avatar
    const name = user.fullName || user.username || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileRole').textContent = user.role || 'User';
    document.getElementById('profileUsername').textContent = user.username || '-';
    document.getElementById('profileEmail').textContent = user.email || '-';
    document.getElementById('profileRoleText').textContent = user.role || '-';
    document.getElementById('profileDepartment').textContent = user.department || '-';
    
    // Format created date (if available)
    let createdDate = 'Unknown';
    if (user.createdAt) {
        createdDate = new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    document.getElementById('profileCreated').textContent = createdDate;
}

// Load profile on page load
window.addEventListener('DOMContentLoaded', loadProfile);
