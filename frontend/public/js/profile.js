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

// Helper function to get initials from name
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Helper function to update avatar display
function updateAvatarDisplay(pictureUrl) {
    const initialsEl = document.getElementById('avatarInitials');
    const pictureEl = document.getElementById('profilePicture');
    
    if (pictureUrl && pictureUrl.trim() !== '') {
        // Show uploaded picture - force refresh by clearing src first
        pictureEl.removeAttribute('src');
        pictureEl.src = pictureUrl;
        pictureEl.style.display = 'block';
        initialsEl.style.display = 'none';
    } else {
        // Show initials by default
        pictureEl.style.display = 'none';
        initialsEl.style.display = 'block';
    }
}

// Load profile data
function renderProfile(currentUser) {
    user = currentUser || user;
    // Get initials for avatar
    const name = user.fullName || user.username || 'User';
    const initials = getInitials(name);
    
    // Update initials element
    const initialsEl = document.getElementById('avatarInitials');
    if (initialsEl) {
        initialsEl.textContent = initials;
    }
    
    // Update profile name and details
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileRole').textContent = user.role || 'User';
    document.getElementById('profileUsername').textContent = user.username || '-';
    document.getElementById('profileEmail').textContent = user.email || '-';
    document.getElementById('profileRoleText').textContent = user.role || '-';
    document.getElementById('profileDepartment').textContent = user.department || '-';
    
    // Check for profile picture
    if (user.profilePicture) {
        updateAvatarDisplay(user.profilePicture);
    } else {
        updateAvatarDisplay(null);
    }
    
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

// Profile picture upload modal functions
function openProfilePictureModal() {
    const modal = document.getElementById('profilePictureModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeProfilePictureModal() {
    const modal = document.getElementById('profilePictureModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Remove profile picture functionality
function removeProfilePicture() {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    
    const removeBtn = document.getElementById('removeProfilePicBtn');
    if (removeBtn) removeBtn.disabled = true;
    
    fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profile_picture: '' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success || data.user) {
            // Update localStorage
            user.profilePicture = '';
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update display
            updateAvatarDisplay(null);
            
            // Hide remove button
            if (removeBtn) removeBtn.style.display = 'none';
            
            closeProfilePictureModal();
            alert('Profile picture removed successfully');
            
            // Dispatch event for header to update
            window.dispatchEvent(new Event('profilePictureRemoved'));
        } else {
            throw new Error(data.message || 'Failed to remove picture');
        }
    })
    .catch(error => {
        console.error('Remove picture error:', error);
        alert('Failed to remove profile picture. Please try again.');
    })
    .finally(() => {
        if (removeBtn) removeBtn.disabled = false;
    });
}

// Toggle remove button visibility based on whether profile picture exists
function updateRemoveButtonVisibility() {
    const removeBtn = document.getElementById('removeProfilePicBtn');
    if (removeBtn && user && user.profilePicture && user.profilePicture.trim() !== '') {
        removeBtn.style.display = 'block';
    } else if (removeBtn) {
        removeBtn.style.display = 'none';
    }
}

// Make functions globally available
window.openProfilePictureModal = openProfilePictureModal;
window.closeProfilePictureModal = closeProfilePictureModal;
window.removeProfilePicture = removeProfilePicture;

// Compress image function to reduce file size
function compressImage(file, maxWidth = 200, maxHeight = 200, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with quality
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Profile picture upload handler
const profilePictureForm = document.getElementById('profilePictureForm');
if (profilePictureForm) {
    profilePictureForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const fileInput = document.getElementById('profilePictureInput');
        const file = fileInput.files[0];

        if (file) {
            // Show loading state
            const submitBtn = profilePictureForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            // Compress the image first
            const pictureUrl = await compressImage(file);
            
            try {
                // Save to backend
                const response = await fetch('/api/auth/me', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ profile_picture: pictureUrl })
                });
                
                const data = await response.json();
                if (!response.ok || !data.success) {
                    console.warn('Could not save to backend, using localStorage only');
                } else {
                    // Update localStorage with the full user data from backend
                    localStorage.setItem('user', JSON.stringify(data.user));
                    user = data.user;
                }
            } catch (error) {
                console.warn('Backend save failed, using localStorage only:', error);
                // Still save to localStorage as fallback
                user.profilePicture = pictureUrl;
                localStorage.setItem('user', JSON.stringify(user));
            }
            
            // Update the avatar display with the new picture
            updateAvatarDisplay(pictureUrl);
            
            // Broadcast the user update to other components/pages
            window._currentHeaderUser = user;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Also update header profile picture in current page immediately
            if (typeof window.updateHeaderProfilePicture === 'function') {
                window.updateHeaderProfilePicture(user);
            }
            
            // Re-enable button
            if (submitBtn) submitBtn.disabled = false;
            
            closeProfilePictureModal();
        }
    });
}

// Close modal when clicking outside
const profilePictureModal = document.getElementById('profilePictureModal');
if (profilePictureModal) {
    profilePictureModal.addEventListener('click', function(event) {
        if (event.target === profilePictureModal) {
            closeProfilePictureModal();
        }
    });
}

// Add event listener for remove profile picture button
const removeProfilePicBtn = document.getElementById('removeProfilePicBtn');
if (removeProfilePicBtn) {
    removeProfilePicBtn.addEventListener('click', function() {
        window.removeProfilePicture();
    });
}

// Update remove button visibility when modal opens
const originalOpenModal = openProfilePictureModal;
openProfilePictureModal = function() {
    originalOpenModal();
    // Update the user object from localStorage before showing modal
    user = JSON.parse(localStorage.getItem('user') || '{}');
    updateRemoveButtonVisibility();
};
window.openProfilePictureModal = openProfilePictureModal;
