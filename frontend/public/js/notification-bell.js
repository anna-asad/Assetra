// Notification Bell for Asset Requests (Admin and Manager only)
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationBell);
    } else {
        initNotificationBell();
    }
})();

async function initNotificationBell() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Only show for Admin and Manager
    if (!token || (user.role !== 'Admin' && user.role !== 'Manager')) {
        return;
    }
    
    // Create notification bell element
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    const bellContainer = document.createElement('div');
    bellContainer.className = 'notification-bell-container';
    bellContainer.innerHTML = `
        <button class="notification-bell-btn" onclick="window.location.href='/views/asset-requests.html'" title="Asset Requests">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="requestBadge" style="display: none;">0</span>
        </button>
    `;
    
    // Insert before user name
    const userName = headerRight.querySelector('.user-name');
    if (userName) {
        headerRight.insertBefore(bellContainer, userName);
    } else {
        headerRight.insertBefore(bellContainer, headerRight.firstChild);
    }
    
    // Load initial count
    await updateRequestCount();
    
    // Poll for updates every 30 seconds
    setInterval(updateRequestCount, 30000);
}

async function updateRequestCount() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/assets/asset-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success && data.requests) {
            // Count pending requests
            const pendingCount = data.requests.filter(req => req.status === 'Pending').length;
            
            const badge = document.getElementById('requestBadge');
            if (badge) {
                if (pendingCount > 0) {
                    badge.textContent = pendingCount > 99 ? '99+' : pendingCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error fetching request count:', error);
    }
}

// Make function globally available
window.updateRequestCount = updateRequestCount;
