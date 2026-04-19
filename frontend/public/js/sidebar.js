// Sidebar Navigation Component
function initSidebar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentPage = window.location.pathname;

    // Create sidebar HTML
    const sidebarHTML = `
        <nav class="sidebar" id="sidebar">
            <ul class="sidebar-menu">
                <li>
                    <a href="/views/dashboard.html" class="${currentPage.includes('dashboard') ? 'active' : ''}">
                        <span class="menu-icon">📊</span>
                        <span class="menu-text">Dashboard</span>
                    </a>
                </li>
                <li data-role="Manager,Admin" style="display: ${user.role === 'Admin' || user.role === 'Manager' ? 'block' : 'none'}">\n                    <a href="/views/assets.html" class="${currentPage.includes('assets') || currentPage.includes('asset-details') ? 'active' : ''}">\n                        <span class="menu-icon">📋</span>\n                        <span class="menu-text">Manage Assets</span>\n                    </a>\n                </li>
                <li data-role="Admin,Viewer" style="display: ${user.role === 'Admin' || user.role === 'Viewer' ? 'block' : 'none'}">\n                    <a href="/views/asset-distribution.html" class="${currentPage.includes('asset-distribution') ? 'active' : ''}">\n                        <span class="menu-icon">📈</span>\n                        <span class="menu-text">Asset Distribution</span>\n                    </a>\n                </li>
                <li>
                    <a href="/views/maintenance-alerts.html" class="${currentPage.includes('maintenance-alerts') ? 'active' : ''}">
                        <span class="menu-icon">🚨</span>
                        <span class="menu-text">Maintenance Alerts</span>
                    </a>
                </li>
                <li>
                    <a href="/views/depreciation-report.html" class="${currentPage.includes('depreciation') ? 'active' : ''}">
                        <span class="menu-icon">💰</span>
                        <span class="menu-text">Financial Report</span>
                    </a>
                </li>
                <li>
                    <a href="/views/profile.html" class="${currentPage.includes('profile') ? 'active' : ''}">
                        <span class="menu-icon">👤</span>
                        <span class="menu-text">Profile</span>
                    </a>
                </li>
                <li data-role="Admin" style="display: ${user.role === 'Admin' ? 'block' : 'none'}">
                    <a href="/views/settings.html" class="${currentPage.includes('settings') ? 'active' : ''}">
                        <span class="menu-icon">⚙️</span>
                        <span class="menu-text">Settings</span>
                    </a>
                </li>
            </ul>
        </nav>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    // Insert sidebar after header
    const header = document.querySelector('.header');
    if (header) {
        header.insertAdjacentHTML('afterend', sidebarHTML);
    }

    // Add sidebar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/sidebar.css';
    document.head.appendChild(link);

    // Hamburger menu toggle
    const menuIcon = document.querySelector('.menu-icon');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mainContent = document.querySelector('.main-content');

    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
            
            // On desktop, collapse/expand
            if (window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
            }
        });
    }

    // Close sidebar when clicking overlay (mobile)
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

// Dropdown toggle functionality
document.addEventListener('click', function(e) {
    if (e.target.closest('.dropdown-toggle')) {
        e.preventDefault();
        const dropdown = e.target.closest('.dropdown');
        dropdown.classList.toggle('open');
    } else if (e.target.closest('.submenu a')) {
        // Close dropdown when submenu item clicked
        const dropdown = e.target.closest('.dropdown');
        if (dropdown) dropdown.classList.remove('open');
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.sidebar')) {
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }
});

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}
