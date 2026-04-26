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

async function displayAssets(assets) {
    const assetsTable = document.getElementById('assetsTable');
    const noAssets = document.getElementById('noAssets');
    const tbody = document.getElementById('assetsTableBody');
    
    if (assets.length === 0) {
        noAssets.style.display = 'block';
        assetsTable.style.display = 'none';
        return;
    }
    
    noAssets.style.display = 'none';
    assetsTable.style.display = 'block';
    tbody.innerHTML = ''; // Always clear first
    
    // Use Promise.all to wait for all API calls
    const assetDetails = await Promise.all(assets.map(async (asset) => {
        let assignedTo = 'Unassigned';
        let healthBadge = '<span class="health-badge health-unknown">N/A</span>';
        
        try {
            // Assignment
            const assignResponse = await fetch(`/api/assets/${asset.asset_id}/assignment`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const assignData = await assignResponse.json();
            if (assignData.success && assignData.assignment) {
                assignedTo = assignData.assignment.assigned_to_name || 
                           assignData.assignment.assigned_to_department + ' Dept' || 'Unassigned';
            }
        } catch (err) {
            console.error('Error fetching assignment:', err);
        }
        
        try {
            // Health
            const healthResponse = await fetch(`/api/assets/${asset.asset_id}/health`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const healthData = await healthResponse.json();
            if (healthData.success && healthData.health) {
                const health = healthData.health;
                const healthClass = health.health_status === 'Healthy' ? 'health-healthy' : 
                                   health.health_status === 'Warning' ? 'health-warning' : 'health-critical';
                healthBadge = `<span class="health-badge ${healthClass}">${health.health_score}</span>`;
            }
        } catch (err) {
            console.error('Error fetching health:', err);
        }
        
        return { asset, assignedTo, healthBadge };
    }));
    
    // Now render all rows synchronously
    assetDetails.forEach(({ asset, assignedTo, healthBadge }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="radio" name="selectedAsset" data-asset-id="${asset.asset_id}" ${selectedAssetId === asset.asset_id ? 'checked' : ''}></td>
            <td>${asset.asset_tag}</td>
            <td>${asset.asset_name}</td>
            <td>${asset.category}</td>
            <td><span class="status-badge status-${asset.status.toLowerCase()}">${asset.status}</span></td>
            <td>${healthBadge}</td>
            <td>${asset.department || '-'}</td>
            <td>${asset.location || '-'}</td>
            <td>${assignedTo}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners once
    tbody.querySelectorAll('input[name="selectedAsset"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            selectedAssetId = e.target.dataset.assetId;
        });
    });
}

// Status filter
document.getElementById('statusFilter').addEventListener('change', (e) => {
    loadAssets(e.target.value);
});

// Search - client-side filter (clear tbody first, prevent duplicates)
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredAssets = allAssets.filter(asset => 
        asset.asset_name.toLowerCase().includes(searchTerm) ||
        asset.asset_tag.toLowerCase().includes(searchTerm) ||
        asset.category.toLowerCase().includes(searchTerm)
    );
    const tbody = document.getElementById('assetsTableBody');
    tbody.innerHTML = ''; // Clear table to prevent duplicates
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
function viewDetails() {
    if (!selectedAssetId) {
        alert('Please select an asset to view details');
        return;
    }
    window.location.href = `/views/asset-details.html?id=${selectedAssetId}`;
}

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load assets initially
    loadAssets();
    loadUsers();
    
    // Initialize department filter for reports
    initializeDepartmentFilter();
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

// ==================== REPORT EXPORT FUNCTIONS ====================

// Initialize department dropdown for report filters
async function initializeDepartmentFilter() {
    try {
        const response = await fetch('/api/reports/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.departments) {
            const departmentSelect = document.getElementById('reportDepartment');
            data.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                departmentSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Generate PDF Report
async function generatePDFReport() {
    const department = document.getElementById('reportDepartment').value || '';
    const startDate = document.getElementById('reportStartDate').value || '';
    const endDate = document.getElementById('reportEndDate').value || '';
    
    try {
        // Build query parameters
        let queryParams = new URLSearchParams();
        if (department) queryParams.append('department', department);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        
        const url = `/api/reports/pdf?${queryParams.toString()}`;
        
        // Trigger download
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Failed to generate PDF report');
            return;
        }
        
        // Download file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `asset-report-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
    } catch (error) {
        console.error('Error generating PDF report:', error);
        alert('Error generating PDF report. Please try again.');
    }
}

// Generate Excel Report
async function generateExcelReport() {
    const department = document.getElementById('reportDepartment').value || '';
    const startDate = document.getElementById('reportStartDate').value || '';
    const endDate = document.getElementById('reportEndDate').value || '';
    
    try {
        // Build query parameters
        let queryParams = new URLSearchParams();
        if (department) queryParams.append('department', department);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        
        const url = `/api/reports/excel?${queryParams.toString()}`;
        
        // Trigger download
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Failed to generate Excel report');
            return;
        }
        
        // Download file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `asset-report-${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
    } catch (error) {
        console.error('Error generating Excel report:', error);
        alert('Error generating Excel report. Please try again.');
    }
}

