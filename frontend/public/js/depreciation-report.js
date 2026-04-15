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

function goBack() {
    window.location.href = '/views/dashboard.html';
}

// Load depreciation report
async function loadReport() {
    const loadingMessage = document.getElementById('loadingMessage');
    const reportContent = document.getElementById('reportContent');
    
    loadingMessage.style.display = 'block';
    reportContent.style.display = 'none';
    
    try {
        const response = await fetch('/api/assets/depreciation/report', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayReport(data);
        } else {
            loadingMessage.textContent = 'Failed to load report';
        }
    } catch (error) {
        console.error('Error loading report:', error);
        loadingMessage.textContent = 'Failed to load report';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayReport(data) {
    const { summary, assets, department } = data;
    
    // Display department name
    document.getElementById('departmentName').textContent = department;
    
    // Display summary
    document.getElementById('totalAssets').textContent = summary.total_assets;
    document.getElementById('totalPurchase').textContent = `$${summary.total_purchase_cost.toFixed(2)}`;
    document.getElementById('currentValue').textContent = `$${summary.total_current_value.toFixed(2)}`;
    document.getElementById('totalDep').textContent = `$${summary.total_accumulated_depreciation.toFixed(2)}`;
    document.getElementById('totalSalvage').textContent = `$${summary.total_salvage_value.toFixed(2)}`;
    document.getElementById('depRate').textContent = `${summary.total_depreciation_percentage}%`;
    
    // Display assets table
    const tbody = document.getElementById('assetsTableBody');
    tbody.innerHTML = '';
    
    if (assets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No assets found</td></tr>';
    } else {
        assets.forEach(asset => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${asset.asset_tag}</td>
                <td>${asset.asset_name}</td>
                <td>${asset.department || '-'}</td>
                <td>$${parseFloat(asset.purchase_cost).toFixed(2)}</td>
                <td>${asset.years_in_use} years</td>
                <td>$${parseFloat(asset.annual_depreciation).toFixed(2)}</td>
                <td>$${parseFloat(asset.accumulated_depreciation).toFixed(2)}</td>
                <td><strong>$${parseFloat(asset.current_book_value).toFixed(2)}</strong></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    document.getElementById('reportContent').style.display = 'block';
}

// Load report on page load
window.addEventListener('DOMContentLoaded', () => {
    loadReport();
});
