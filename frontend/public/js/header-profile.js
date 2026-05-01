// Shared header profile picture functionality
// This file should be included in all pages that need the profile picture in the header

(function() {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeaderProfile);
    } else {
        initHeaderProfile();
    }
    
    // Listen for storage changes from other tabs/pages (useful when profile is updated elsewhere)
    window.addEventListener('storage', function(e) {
        if (e.key === 'user') {
            const newUser = JSON.parse(e.newValue || '{}');
            updateHeaderProfilePicture(newUser);
        }
    });
    
    // Periodically check for user updates (every 2 seconds) to catch changes from same-page profile updates
    setInterval(function() {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUser = window._currentHeaderUser || storedUser;
        
        // Check if profile picture changed
        if (currentUser && storedUser && 
            currentUser.profilePicture !== storedUser.profilePicture) {
            window._currentHeaderUser = storedUser;
            updateHeaderProfilePicture(storedUser);
        }
    }, 2000);
})();

function initHeaderProfile() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Only proceed if user is logged in
    if (!token) {
        return;
    }
    
    // Update user name in header
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.fullName || user.username || 'User';
    }
    
    // Update profile picture in header
    updateHeaderProfilePicture(user);
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function updateHeaderProfilePicture(user) {
    const profilePictureEl = document.getElementById('profilePicture');
    const avatarInitialsEl = document.getElementById('avatarInitials');
    const removeBtn = document.getElementById('removeProfilePicBtn');

    // Toggle visibility of the "Remove Picture" button based on presence of a profile picture
    if (removeBtn) {
        const hasPic = user && user.profilePicture && user.profilePicture.trim() !== '';
        removeBtn.style.display = hasPic ? 'block' : 'none';
    }
    
    if (!profilePictureEl) {
        // No profile picture element in header - this page doesn't have header-right avatar
        return;
    }
    
// Check if user has a profile picture
    if (user && user.profilePicture && user.profilePicture.trim() !== '') {
        // Show uploaded profile picture - force refresh first
        profilePictureEl.removeAttribute('src');
        profilePictureEl.src = user.profilePicture;
        profilePictureEl.style.display = 'block';
        
        // Hide initials if present
        if (avatarInitialsEl) {
            avatarInitialsEl.style.display = 'none';
        }
    } else {
        // No profile picture - show default or initials
        profilePictureEl.src = '/public/images/default-avatar.png';
        profilePictureEl.style.display = 'block';
        
        // Optionally show initials as fallback
        if (avatarInitialsEl) {
            const name = user.fullName || user.username || 'User';
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            avatarInitialsEl.textContent = initials;
        }
    }
}

async function removeProfilePicture() {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    
    const token = localStorage.getItem('token');
    try {
        // Call endpoint to remove profile picture from the database
        const response = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profile_picture: '' })
        });
        
        const data = await response.json();
        
        if (data.success || data.user) {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.profilePicture = '';
            localStorage.setItem('user', JSON.stringify(storedUser));
            
            updateHeaderProfilePicture(storedUser);
            
            if (window.closeProfilePictureModal) {
                window.closeProfilePictureModal();
            }
            alert('Profile picture removed successfully');
        } else {
            alert(data.message || 'Failed to remove profile picture');
        }
    } catch (error) {
        console.error('Remove picture error:', error);
        alert('Connection error. Please try again.');
    }
}

async function handleLogout() {
    const token = localStorage.getItem('token');
    
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
}

// Initialize button listener if present on the page
document.addEventListener('DOMContentLoaded', () => {
    const removeBtn = document.getElementById('removeProfilePicBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', removeProfilePicture);
    }
});

// Make functions globally available
window.updateHeaderProfilePicture = updateHeaderProfilePicture;
window.removeProfilePicture = removeProfilePicture;
