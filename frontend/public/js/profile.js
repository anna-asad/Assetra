// Check if user is logged in
const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');

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
function renderProfile(currentUser) {
    user = currentUser || user;
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

async function loadProfileFromBackend() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load profile');
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        renderProfile(data.user);
        // Also keep header name in sync
        document.getElementById('userName').textContent = data.user.fullName || data.user.username || 'User';
    } catch (error) {
        console.error('Error loading profile from backend:', error);
        // Fallback to localStorage render
        renderProfile(user);
    }
}

// Edit profile modal logic
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfileModalBtn = document.getElementById('closeEditProfileModalBtn');
const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
const editProfileForm = document.getElementById('editProfileForm');
const editProfileError = document.getElementById('editProfileError');
const editFullName = document.getElementById('editFullName');
const editEmail = document.getElementById('editEmail');

function openEditProfileModal() {
    editProfileError.style.display = 'none';
    editProfileError.textContent = '';
    editFullName.value = user.fullName || '';
    editEmail.value = user.email || '';
    editProfileModal.style.display = 'flex';
}

function closeEditProfileModal() {
    editProfileModal.style.display = 'none';
}

if (editProfileBtn) editProfileBtn.addEventListener('click', openEditProfileModal);
if (closeEditProfileModalBtn) closeEditProfileModalBtn.addEventListener('click', closeEditProfileModal);
if (cancelEditProfileBtn) cancelEditProfileBtn.addEventListener('click', closeEditProfileModal);

if (editProfileModal) {
    editProfileModal.addEventListener('click', (e) => {
        if (e.target === editProfileModal) closeEditProfileModal();
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        editProfileError.style.display = 'none';
        editProfileError.textContent = '';

        const payload = {
            full_name: editFullName.value.trim(),
            email: editEmail.value.trim()
        };

        try {
            const response = await fetch('/api/auth/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to update profile');
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            renderProfile(data.user);
            document.getElementById('userName').textContent = data.user.fullName || data.user.username || 'User';
            closeEditProfileModal();
        } catch (error) {
            console.error('Profile update error:', error);
            editProfileError.textContent = error.message || 'Failed to update profile';
            editProfileError.style.display = 'block';
        }
    });
}

// Load profile on page load
window.addEventListener('DOMContentLoaded', loadProfileFromBackend);
