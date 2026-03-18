// Role-based UI helper
function initRoleBasedUI() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role;

    // Hide elements based on role
    const adminOnlyElements = document.querySelectorAll('[data-role="Admin"]');
    const managerOnlyElements = document.querySelectorAll('[data-role="Manager"]');

    if (role !== 'Admin') {
        adminOnlyElements.forEach(el => {
            el.style.display = 'none';
        });
    }

    if (role !== 'Manager') {
        managerOnlyElements.forEach(el => {
            el.style.display = 'none';
        });
    }

    // Show role badge
    const roleBadges = document.querySelectorAll('.user-role-badge');
    roleBadges.forEach(badge => {
        badge.textContent = role;
        badge.className = `user-role-badge role-${role.toLowerCase()}`;
    });
}

// Call on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initRoleBasedUI);
}
