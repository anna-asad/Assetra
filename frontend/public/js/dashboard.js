// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Display user name
document.getElementById('userName').textContent = user.fullName || user.username || 'User';

// Total Assets card click - navigate to assets list
document.getElementById('totalAssetsCard').addEventListener('click', () => {
    window.location.href = '/views/assets.html';
});

// Total Value card click - show modal with assets
document.getElementById('totalValueCard').addEventListener('click', () => {
    openAssetsModal();
});

// Maintenance Assets card - show maintenance list
document.getElementById('maintenanceAssetsCard').addEventListener('click', () => {
    openMaintenanceModal();
});

// Missing Assets card - show missing list
document.getElementById('missingAssetsCard').addEventListener('click', () => {
    openMissingModal();
});

// Modal functionality
const modal = document.getElementById('assetsModal');
const closeModalBtn = document.getElementById('closeModalBtn');

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

async function openAssetsModal() {
    modal.style.display = 'flex';
    await loadAssetsForValue();
}

async function loadAssetsByStatus(status) {
    const loadingMessage = document.getElementById('modalLoadingMessage');
    const errorMessage = document.getElementById('modalErrorMessage');
    const assetsTable = document.getElementById('assetsValueTable');
    const noAssets = document.getElementById('noAssetsValue');
    
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    assetsTable.style.display = 'none';
    noAssets.style.display = 'none';
    
    try {
        const response = await fetch(`/api/assets?status=${status}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAssetsForValue(data.assets);
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

async function loadAssetsForValue() {
    await loadAssetsByStatus(); // All assets for value modal
}

async function openMaintenanceModal() {
    document.getElementById('assetsModal').style.display = 'flex';
    document.querySelector('.modal-header h2').textContent = 'Assets Under Maintenance';
    await loadAssetsByStatus('Maintenance');
}

async function openMissingModal() {
    document.getElementById('assetsModal').style.display = 'flex';
    document.querySelector('.modal-header h2').textContent = 'Missing Assets';
    await loadAssetsByStatus('Missing');
}

function displayAssetsForValue(assets) {
    const assetsTable = document.getElementById('assetsValueTable');
    const noAssets = document.getElementById('noAssetsValue');
    const tbody = document.getElementById('assetsValueTableBody');
    
    if (assets.length === 0) {
        noAssets.style.display = 'block';
        return;
    }
    
    tbody.innerHTML = '';
    
    assets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.asset_name}</td>
            <td>${asset.department || '-'}</td>
            <td><span class="status-badge status-${asset.status.toLowerCase()}">${asset.status}</span></td>
            <td>${formatPKRCurrency(asset.purchase_cost || 0)}</td>
        `;
        tbody.appendChild(row);
    });
    
    assetsTable.style.display = 'block';
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

function formatPKRCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR'
  }).format(value);
}

// Fetch dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Dashboard API Response:', data);

        if (data.success) {
            const stats = data.stats;
            console.log('Stats object:', stats);
            console.log('Status breakdown:', stats.statusBreakdown);

            // Show department info for Managers
            const departmentInfo = document.getElementById('departmentInfo');
            if (stats.department && stats.department !== 'All Departments') {
                departmentInfo.textContent = `Viewing: ${stats.department} Department`;
                departmentInfo.style.display = 'block';
            }

            // Update stat cards
            document.getElementById('totalAssets').textContent = stats.totalAssets || 0;
            document.getElementById('totalAssetValue').textContent = formatPKRCurrency(stats.totalAssetValue || 0);
            document.getElementById('missingAssets').textContent = stats.statusBreakdown.Missing || 0;
            document.getElementById('maintenanceAssets').textContent = stats.statusBreakdown.Maintenance || 0;
            
            // New metrics
            document.getElementById('maintenanceCost').textContent = formatPKRCurrency(stats.maintenanceCost || 0);
            document.getElementById('complianceScore').textContent = (stats.complianceScore || 0).toFixed(1) + '%';
            document.getElementById('complianceArc').style.strokeDasharray = (stats.complianceScore || 0) + ' 100';
            document.getElementById('auditedCount').textContent = stats.auditedCount || 0;
            document.getElementById('maintainedCount').textContent = stats.maintainedCount || 0;

            // Update bar chart
            console.log('Updating bar chart with values:', {
                Available: stats.statusBreakdown.Available || 0,
                Allocated: stats.statusBreakdown.Allocated || 0,
                Maintenance: stats.statusBreakdown.Maintenance || 0,
                Missing: stats.statusBreakdown.Missing || 0
            });
            
            document.getElementById('availableCount').textContent = stats.statusBreakdown.Available || 0;
            document.getElementById('allocatedCount').textContent = stats.statusBreakdown.Allocated || 0;
            document.getElementById('maintenanceCount').textContent = stats.statusBreakdown.Maintenance || 0;
            document.getElementById('missingCount').textContent = stats.statusBreakdown.Missing || 0;

            // Update bar heights based on values
            updateBarHeights(stats.statusBreakdown);
        } else {
            console.error('Failed to load dashboard stats:', data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/views/login.html';
        }
    }
}

function updateBarHeights(statusBreakdown) {
    const maxValue = Math.max(
        statusBreakdown.Available || 0,
        statusBreakdown.Allocated || 0,
        statusBreakdown.Maintenance || 0,
        statusBreakdown.Missing || 0,
        1
    );

    const bars = document.querySelectorAll('.bar');
    const values = [
        statusBreakdown.Available || 0,
        statusBreakdown.Allocated || 0,
        statusBreakdown.Maintenance || 0,
        statusBreakdown.Missing || 0
    ];

    bars.forEach((bar, index) => {
        const percentage = (values[index] / maxValue) * 100;
        bar.style.height = Math.max(percentage, 20) + '%';
    });
}

// Load dashboard data on page load
window.addEventListener('DOMContentLoaded', loadDashboardStats);
