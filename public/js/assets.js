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
let currentAssetId = null;

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
    
    assets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.asset_tag}</td>
            <td>${asset.asset_name}</td>
            <td>${asset.category}</td>
            <td><span class="status-badge status-${asset.status.toLowerCase()}">${asset.status}</span></td>
            <td>${asset.department || '-'}</td>
            <td>${asset.location || '-'}</td>
            <td>
                <button class="action-btn" onclick="openStatusModal(${asset.asset_id}, '${asset.asset_name}', '${asset.status}')">
                    Update Status
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    assetsTable.style.display = 'block';
}

// Status filter
document.getElementById('statusFilter').addEventListener('change', (e) => {
    loadAssets(e.target.value);
});

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredAssets = allAssets.filter(asset => 
        asset.asset_tag.toLowerCase().includes(searchTerm) ||
        asset.asset_name.toLowerCase().includes(searchTerm) ||
        asset.category.toLowerCase().includes(searchTerm)
    );
    displayAssets(filteredAssets);
});

// Modal functions
function openStatusModal(assetId, assetName, currentStatus) {
    currentAssetId = assetId;
    document.getElementById('modalAssetName').textContent = `Asset: ${assetName}`;
    document.getElementById('newStatus').value = currentStatus;
    document.getElementById('statusModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('statusModal').style.display = 'none';
    currentAssetId = null;
}

async function updateStatus() {
    const newStatus = document.getElementById('newStatus').value;
    
    try {
        const response = await fetch(`/api/assets/${currentAssetId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal();
            loadAssets(document.getElementById('statusFilter').value);
        } else {
            alert(data.message || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Connection error. Please try again.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('statusModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Load assets on page load
window.addEventListener('DOMContentLoaded', () => loadAssets());
