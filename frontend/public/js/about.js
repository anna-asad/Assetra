// About page script - public page, no auth required
const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = localStorage.getItem('token');

// Display user name if logged in
const userNameEl = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

if (userNameEl) {
    userNameEl.textContent = user.fullName || user.username || 'Guest';
}

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (!token) {
            window.location.href = '/views/login.html';
            return;
        }
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
}

