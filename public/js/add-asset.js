// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Display user name
document.getElementById('userName').textContent = user.fullName || user.username || 'User';

// Global close function
function closeErrorModal() {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.classList.remove('error-modal', 'show');
  errorMessage.innerHTML = '';
}

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

// Check if editing existing asset
const urlParams = new URLSearchParams(window.location.search);
const editingAssetId = localStorage.getItem('editingAssetId') || urlParams.get('edit') || urlParams.get('assetId');
let isEditing = !!editingAssetId;

if (isEditing) {
    document.querySelector('.page-title').textContent = 'Edit Asset';
    document.querySelector('.btn-primary').textContent = 'Update Asset';
}

// Load asset data for editing
async function loadAssetForEdit(assetId) {
    try {
        const response = await fetch(`/api/assets/${assetId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success && data.asset) {
            const asset = data.asset;
            document.getElementById('asset_tag').value = asset.asset_tag;
            document.getElementById('asset_name').value = asset.asset_name;
            document.getElementById('category').value = asset.category;
            document.getElementById('status').value = asset.status;
            document.getElementById('purchase_date').value = asset.purchase_date || '';
            document.getElementById('purchase_cost').value = asset.purchase_cost || '';
            document.getElementById('location').value = asset.location || '';
            document.getElementById('department').value = asset.department || '';
            document.getElementById('description').value = asset.description || '';
        }
    } catch (error) {
        console.error('Error loading asset:', error);
    }
}

// Load asset if editing
if (isEditing && editingAssetId) {
    loadAssetForEdit(editingAssetId);
}

// Handle form submission
const assetForm = document.getElementById('assetForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

assetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous messages
    errorMessage.classList.remove('error-modal', 'show');
    successMessage.classList.remove('show');
    
    // Get form data
    const formData = {
        asset_tag: document.getElementById('asset_tag').value.trim(),
        asset_name: document.getElementById('asset_name').value.trim(),
        category: document.getElementById('category').value,
        status: document.getElementById('status').value,
        purchase_date: document.getElementById('purchase_date').value || null,
        purchase_cost: document.getElementById('purchase_cost').value,
        location: document.getElementById('location').value || null,
        department: document.getElementById('department').value || null,
        description: document.getElementById('description').value || null
    };
    
    // Frontend validation
    if (!formData.asset_tag || !formData.asset_name) {
      errorMessage.innerHTML = `
        <div class="modal-content">
          <h3>Asset Adding Unsuccessful</h3>
          <p>Asset tag and name are required</p>
          <button class="close-btn" onclick="closeErrorModal()">Close</button>
        </div>
      `;
      errorMessage.classList.add('error-modal', 'show');
      return;
    }
    
    const purchaseCost = parseFloat(formData.purchase_cost);
    if (!formData.purchase_cost || isNaN(purchaseCost) || purchaseCost <= 0) {
      errorMessage.innerHTML = `
        <div class="modal-content">
          <h3>Asset Adding Unsuccessful</h3>
          <p>Purchase price is mandatory and must be a positive number</p>
          <button class="close-btn" onclick="closeErrorModal()">Close</button>
        </div>
      `;
      errorMessage.classList.add('error-modal', 'show');
      return;
    }
    
    // Disable submit button
    const submitBtn = assetForm.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? 'Updating...' : 'Adding...';
    
    try {
        const url = isEditing ? `/api/assets/${editingAssetId}` : '/api/assets';
        const method = isEditing ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMessage.textContent = isEditing ? 'Asset updated successfully!' : 'Asset added successfully!';
            successMessage.classList.add('show');
            
            localStorage.removeItem('editingAssetId');
            
            // Reset form and redirect
            assetForm.reset();
            setTimeout(() => {
                window.location.href = '/views/assets.html';
            }, 2000);
        } else {
            errorMessage.innerHTML = `
              <div class="modal-content">
                <h3>Asset Adding Unsuccessful</h3>
                <p>${data.message}</p>
                <button class="close-btn" onclick="closeErrorModal()">Close</button>
              </div>
            `;
            errorMessage.classList.add('error-modal', 'show');
        }
    } catch (error) {
        console.error('Error saving asset:', error);
        errorMessage.innerHTML = `
          <div class="modal-content">
            <h3>Asset Adding Unsuccessful</h3>
            <p>Connection error. Please try again.</p>
            <button class="close-btn" onclick="closeErrorModal()">Close</button>
          </div>
        `;
        errorMessage.classList.add('error-modal', 'show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
