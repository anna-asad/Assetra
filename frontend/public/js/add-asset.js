// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Viewer cannot add/edit assets
if (user.role === 'Viewer') {
    window.location.href = '/views/assets.html';
}

// Global close function
function closeErrorModal() {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.classList.remove('error-modal', 'show');
  errorMessage.innerHTML = '';
}

// Check if editing existing asset
const urlParams = new URLSearchParams(window.location.search);
let editingAssetId = localStorage.getItem('editingAssetId') || urlParams.get('edit') || urlParams.get('assetId');

// Ensure we don't treat string "null" or "undefined" as a valid ID
if (editingAssetId === 'null' || editingAssetId === 'undefined' || editingAssetId === '') {
    editingAssetId = null;
}

let isEditing = !!editingAssetId;

console.log('Editing Asset ID:', editingAssetId);
console.log('Is Editing:', isEditing);

// Load departments for the dropdown
async function loadDepartments() {
    try {
        const response = await fetch('/api/auth/departments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        const select = document.getElementById('department');
        if (select) {
            select.innerHTML = '<option value="">Select Department</option>';
            
            if (data.success && data.departments) {
                data.departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.department_name;
                    option.textContent = dept.department_name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Load asset data for editing
async function loadAssetForEdit(assetId) {
    try {
        console.log('Fetching asset with ID:', assetId);
        const response = await fetch(`/api/assets/${assetId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.success && data.asset) {
            const asset = data.asset;
            console.log('Populating form with asset:', asset);
            
            // Set all form field values
            const setFieldValue = (fieldId, value) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value || '';
                    console.log(`Set ${fieldId} to:`, field.value);
                } else {
                    console.warn(`Field not found: ${fieldId}`);
                }
            };
            
            setFieldValue('asset_tag', asset.asset_tag);
            setFieldValue('asset_name', asset.asset_name);
            setFieldValue('category', asset.category);
            setFieldValue('status', asset.status);
            setFieldValue('purchase_date', asset.purchase_date ? asset.purchase_date.split('T')[0] : '');
            setFieldValue('purchase_cost', asset.purchase_cost);
            setFieldValue('location', asset.location);
            setFieldValue('department', asset.department);
            setFieldValue('description', asset.description);
        } else {
            console.error('Failed to load asset data:', data);
        }
    } catch (error) {
        console.error('Error loading asset:', error);
    }
}

// Initialize the page when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    
    // Display user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.fullName || user.username || 'User';
    }
    
    // Clear localStorage if coming from assets page without edit
    if (!editingAssetId) {
        localStorage.removeItem('editingAssetId');
    }
    
    // Load last used useful life years
    const lastUsefulLife = localStorage.getItem('lastUsefulLifeYears');
    if (lastUsefulLife && !isEditing) {
        const usefulLifeField = document.getElementById('useful_life_years');
        if (usefulLifeField) {
            usefulLifeField.value = lastUsefulLife;
        }
    }
    
    // Update page title and button if editing
    if (isEditing) {
        const pageTitle = document.querySelector('.page-title');
        const submitBtn = document.querySelector('.btn-primary');
        
        if (pageTitle) pageTitle.textContent = 'Edit Asset';
        if (submitBtn) submitBtn.textContent = 'Update Asset';
        
        // Load the asset data
        console.log('Loading asset data for edit mode');
        await loadAssetForEdit(editingAssetId);
    } else {
        // In add mode - clear any previous form data
        const assetForm = document.getElementById('assetForm');
        if (assetForm) {
            assetForm.reset();
            console.log('Form cleared for new asset entry');
            
            // Restore useful life years after reset
            if (lastUsefulLife) {
                const usefulLifeField = document.getElementById('useful_life_years');
                if (usefulLifeField) {
                    usefulLifeField.value = lastUsefulLife;
                }
            }
        }
        
        const pageTitle = document.querySelector('.page-title');
        const submitBtn = document.querySelector('.btn-primary');
        
        if (pageTitle) pageTitle.textContent = 'Add New Asset';
        if (submitBtn) submitBtn.textContent = 'Add Asset';
    }
    
    // Setup form submission
    setupFormSubmission();
    
    // Load departments for dropdown
    await loadDepartments();
    
    // Setup logout
    setupLogout();
    
    // Setup sidebar
    if (window.initSidebar) {
        window.initSidebar();
    }
});

// Logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
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
}

// Handle form submission
function setupFormSubmission() {
    const assetForm = document.getElementById('assetForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (!assetForm) {
        console.error('Asset form not found');
        return;
    }
    
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
            warranty_expiry_date: document.getElementById('warranty_expiry_date').value || null,
            useful_life_years: document.getElementById('useful_life_years').value || 5,
            location: document.getElementById('location').value || null,
            department: document.getElementById('department').value || null,
            description: document.getElementById('description').value || null
        };
        
        // Save useful life years to localStorage for next time
        if (formData.useful_life_years) {
            localStorage.setItem('lastUsefulLifeYears', formData.useful_life_years);
        }
        
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
}
