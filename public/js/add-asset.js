// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
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

// Handle form submission
const assetForm = document.getElementById('assetForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

assetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous messages
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    
    // Get form data
    const formData = {
        asset_tag: document.getElementById('asset_tag').value,
        asset_name: document.getElementById('asset_name').value,
        category: document.getElementById('category').value,
        status: document.getElementById('status').value,
        purchase_date: document.getElementById('purchase_date').value || null,
        purchase_cost: document.getElementById('purchase_cost').value || null,
        location: document.getElementById('location').value || null,
        department: document.getElementById('department').value || null,
        description: document.getElementById('description').value || null
    };
    
    // Disable submit button
    const submitBtn = assetForm.querySelector('.btn-primary');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding Asset...';
    
    try {
        const response = await fetch('/api/assets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMessage.textContent = 'Asset added successfully!';
            successMessage.classList.add('show');
            
            // Reset form
            assetForm.reset();
            
            // Redirect to assets page after 2 seconds
            setTimeout(() => {
                window.location.href = '/views/assets.html';
            }, 2000);
        } else {
            errorMessage.textContent = data.message || 'Failed to add asset';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Error adding asset:', error);
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Asset';
    }
});
