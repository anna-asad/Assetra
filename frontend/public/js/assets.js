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

let allAssets = [];
let selectedAssetId = null;
let allUsers = [];

// Function to add a new asset - clears edit mode
function addNewAsset() {
    localStorage.removeItem('editingAssetId');
    window.location.href = '/views/add-asset.html';
}

// Load assets
async function loadAssets(statusFilter = '') {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const assetsTable = document.getElementById('assetsTable');
    const noAssets = document.getElementById('noAssets');
    
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    assetsTable.style.display = 'none';
    noAssets.style.display = 'none';
    
    try {
        let url = '/api/assets';
        if (statusFilter) {
            url += `?status=${statusFilter}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allAssets = data.assets;
            displayAssets(allAssets);
        } else {
            errorMessage.textContent = data.message || 'Failed to load assets';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading assets:', error);
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayAssets(assets) {
    const assetsTable = document.getElementById('assetsTable');
    const noAssets = document.getElementById('noAssets');
    const tbody = document.getElementById('assetsTableBody');
    
    if (assets.length === 0) {
        noAssets.style.display = 'block';
        return;
    }
    
    tbody.innerHTML = '';
    
    // Fetch assignments for all assets
    assets.forEach(async (asset) => {
        const row = document.createElement('tr');
        
        // Fetch assignment info
        let assignedTo = 'Unassigned';
        try {
            const assignResponse = await fetch(`/api/assets/${asset.asset_id}/assignment`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const assignData = await assignResponse.json();
            if (assignData.success && assignData.assignment) {
                if (assignData.assignment.assigned_to_name) {
                    assignedTo = assignData.assignment.assigned_to_name;
                } else if (assignData.assignment.assigned_to_department) {
                    assignedTo = assignData.assignment.assigned_to_department + ' Dept';
                }
            }
        } catch (err) {
            console.error('Error fetching assignment:', err);
        }
        
        row.innerHTML = `
            <td><input type="radio" name="selectedAsset" data-asset-id="${asset.asset_id}" ${selectedAssetId === asset.asset_id ? 'checked' : ''}></td>
            <td>${asset.asset_tag}</td>
            <td>${asset.asset_name}</td>
            <td>${asset.category}</td>
            <td><span class="status-badge status-${asset.status.toLowerCase()}">${asset.status}</span></td>
            <td>${asset.department || '-'}</td>
            <td>${asset.location || '-'}</td>
            <td>${assignedTo}</td>
        `;
        tbody.appendChild(row);
    });

    // Add selection listener
    setTimeout(() => {
        tbody.querySelectorAll('input[name="selectedAsset"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                selectedAssetId = e.target.dataset.assetId;
            });
        });
    }, 100);
    
    assetsTable.style.display = 'block';
}

// Status filter
document.getElementById('statusFilter').addEventListener('change', (e) => {
    loadAssets(e.target.value);
});

// Search - searches asset name, tag, and category
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredAssets = allAssets.filter(asset => 
        asset.asset_name.toLowerCase().includes(searchTerm) ||
        asset.asset_tag.toLowerCase().includes(searchTerm) ||
        asset.category.toLowerCase().includes(searchTerm)
    );
    displayAssets(filteredAssets);
});

// Update status directly from dropdown
async function updateStatus(assetId, newStatus) {
    if (!newStatus) return;
    
    try {
        const response = await fetch(`/api/assets/${assetId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadAssets(document.getElementById('statusFilter').value);
        } else {
            alert(data.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Connection error. Please try again.');
    }
}

// New button functions
function editSelected() {
    if (!selectedAssetId) {
        alert('Please select an asset to edit');
        return;
    }
    // Store selected asset ID and redirect to edit form
    localStorage.setItem('editingAssetId', selectedAssetId);
    window.location.href = '/views/add-asset.html?edit=true';
}

async function removeSelected() {
    if (!selectedAssetId) {
        alert('Please select an asset to remove');
        return;
    }
    if (!confirm('Are you sure you want to permanently delete this asset?')) return;
    
    try {
        const response = await fetch(`/api/assets/${selectedAssetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadAssets(document.getElementById('statusFilter').value);
            selectedAssetId = null;
            alert('Asset deleted successfully');
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete asset');
        }
    } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Connection error. Please try again.');
    }
}

async function markMaintenance() {
    if (!selectedAssetId) {
        alert('Please select an asset');
        return;
    }
    await updateStatus(selectedAssetId, 'Maintenance');
}

async function markMissing() {
    if (!selectedAssetId) {
        alert('Please select an asset');
        return;
    }
    await updateStatus(selectedAssetId, 'Missing');
}

// Load assets on page load
window.addEventListener('DOMContentLoaded', () => {
    loadAssets();
    loadUsers();
});

// Assignment functions
async function loadUsers() {
    try {
        const response = await fetch('/api/assets/users/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allUsers = data.users;
            populateUserDropdown();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function populateUserDropdown() {
    const userSelect = document.getElementById('assignedUser');
    userSelect.innerHTML = '<option value="">-- Select Employee --</option>';
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.user_id;
        option.textContent = `${user.full_name} (${user.department || 'No Dept'})`;
        userSelect.appendChild(option);
    });
}

function assignSelected() {
    if (!selectedAssetId) {
        alert('Please select an asset to assign');
        return;
    }
    document.getElementById('assignModal').style.display = 'block';
    document.getElementById('effectiveDate').valueAsDate = new Date();
}

function closeAssignModal() {
    document.getElementById('assignModal').style.display = 'none';
    document.getElementById('assignForm').reset();
}

function toggleAssignFields() {
    const assignType = document.getElementById('assignType').value;
    const userField = document.getElementById('userField');
    const departmentField = document.getElementById('departmentField');
    
    if (assignType === 'user') {
        userField.style.display = 'block';
        departmentField.style.display = 'none';
        document.getElementById('assignedUser').required = true;
        document.getElementById('assignedDepartment').required = false;
    } else {
        userField.style.display = 'none';
        departmentField.style.display = 'block';
        document.getElementById('assignedUser').required = false;
        document.getElementById('assignedDepartment').required = true;
    }
}

document.getElementById('assignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const assignType = document.getElementById('assignType').value;
    const effectiveDate = document.getElementById('effectiveDate').value;
    
    const assignmentData = {
        effective_date: effectiveDate
    };
    
    if (assignType === 'user') {
        assignmentData.assigned_to_user_id = parseInt(document.getElementById('assignedUser').value);
    } else {
        assignmentData.assigned_to_department = document.getElementById('assignedDepartment').value;
    }
    
    try {
        const response = await fetch(`/api/assets/${selectedAssetId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(assignmentData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Asset assigned successfully!');
            closeAssignModal();
            loadAssets(document.getElementById('statusFilter').value);
        } else {
            alert(data.message || 'Failed to assign asset');
        }
    } catch (error) {
        console.error('Error assigning asset:', error);
        alert('Connection error. Please try again.');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('assignModal');
    if (event.target === modal) {
        closeAssignModal();
    }
};

