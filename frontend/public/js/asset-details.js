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

// Get asset ID from URL
const urlParams = new URLSearchParams(window.location.search);
const assetId = parseInt(urlParams.get('id'));

if (!assetId || isNaN(assetId)) {
    alert('Invalid or missing asset ID');
    window.location.href = '/views/assets.html';
}

// Tab switching
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    if (tabName === 'details') {
        tabs[0].classList.add('active');
        document.getElementById('detailsTab').classList.add('active');
    } else if (tabName === 'financial') {
        tabs[1].classList.add('active');
        document.getElementById('financialTab').classList.add('active');
        loadFinancialData();
    } else if (tabName === 'history') {
        tabs[2].classList.add('active');
        document.getElementById('historyTab').classList.add('active');
        loadHistory();
    }
}

// Go back to assets page
function goBack() {
    window.location.href = '/views/assets.html';
}

// Load asset details
async function loadAssetDetails() {
    try {
        const response = await fetch(`/api/assets/${assetId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.asset) {
            const asset = data.asset;
            
            document.getElementById('assetTag').textContent = asset.asset_tag || '-';
            document.getElementById('assetName').textContent = asset.asset_name || '-';
            document.getElementById('category').textContent = asset.category || '-';
            document.getElementById('status').textContent = asset.status || '-';
            document.getElementById('department').textContent = asset.department || '-';
            document.getElementById('location').textContent = asset.location || '-';
            document.getElementById('purchaseDate').textContent = asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-';
            document.getElementById('purchaseCost').textContent = asset.purchase_cost ? `Rs.${parseFloat(asset.purchase_cost).toFixed(2)}` : '-';

            document.getElementById('description').textContent = asset.description || '-';
            document.getElementById('createdAt').textContent = asset.created_at ? new Date(asset.created_at).toLocaleString() : '-';
            
            // Load assignment info
            loadAssignment();
        } else {
            alert('Asset not found');
            window.location.href = '/views/assets.html';
        }
    } catch (error) {
        console.error('Error loading asset:', error);
        alert('Failed to load asset details');
    }
}

// Load assignment info
async function loadAssignment() {
    try {
        const response = await fetch(`/api/assets/${assetId}/assignment`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.assignment) {
            const assignment = data.assignment;
            let assignedText = 'Unassigned';
            
            if (assignment.assigned_to_name) {
                assignedText = assignment.assigned_to_name;
            } else if (assignment.assigned_to_department) {
                assignedText = assignment.assigned_to_department + ' Department';
            }
            
            document.getElementById('assignedTo').textContent = assignedText;
        } else {
            document.getElementById('assignedTo').textContent = 'Unassigned';
        }
    } catch (error) {
        console.error('Error loading assignment:', error);
        document.getElementById('assignedTo').textContent = 'Error loading';
    }
}

// Load change history
let historyLoaded = false;
let financialLoaded = false;

async function loadFinancialData() {
    if (financialLoaded) return;
    
    const loadingFinancial = document.getElementById('loadingFinancial');
    const financialData = document.getElementById('financialData');
    
    loadingFinancial.style.display = 'block';
    financialData.style.display = 'none';
    
    try {
        const response = await fetch(`/api/assets/${assetId}/depreciation`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.depreciation) {
            displayFinancialData(data.depreciation);
            financialLoaded = true;
        } else {
            loadingFinancial.textContent = 'Failed to load financial data';
        }
    } catch (error) {
        console.error('Error loading financial data:', error);
        loadingFinancial.textContent = 'Failed to load financial data';
    } finally {
        loadingFinancial.style.display = 'none';
    }
}

function displayFinancialData(dep) {
    document.getElementById('finPurchaseCost').textContent = `Rs.${dep.purchase_cost.toFixed(2)}`;
    document.getElementById('finSalvageValue').textContent = `Rs.${dep.salvage_value.toFixed(2)}`;
    document.getElementById('finUsefulLife').textContent = `${dep.useful_life_years} years`;
    document.getElementById('finYearsInUse').textContent = `${dep.years_in_use} years`;
    document.getElementById('finBookValue').textContent = `Rs.${dep.current_book_value.toFixed(2)}`;
    document.getElementById('finAnnualDep').textContent = `Rs.${dep.annual_depreciation.toFixed(2)}`;
    document.getElementById('finAccumDep').textContent = `Rs.${dep.accumulated_depreciation.toFixed(2)}`;
    document.getElementById('finDepRate').textContent = `${dep.depreciation_rate}%`;
    
    // Draw simple depreciation chart
    drawDepreciationChart(dep);
    
    document.getElementById('financialData').style.display = 'block';
}

function drawDepreciationChart(dep) {
    const canvas = document.getElementById('depreciationChart');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate data points
    const years = dep.useful_life_years || 5;
    const dataPoints = [];
    for (let i = 0; i <= years; i++) {
        const value = Math.max(
            dep.purchase_cost - (dep.annual_depreciation * i),
            dep.salvage_value
        );
        dataPoints.push(value);
    }
    
    const maxValue = dep.purchase_cost;
    
    // Draw axes
    ctx.strokeStyle = '#e8b4e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(232, 180, 232, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#e8b4e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    dataPoints.forEach((value, index) => {
        const x = padding + (chartWidth / years) * index;
        const y = height - padding - (value / maxValue) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = '#e8b4e8';
    dataPoints.forEach((value, index) => {
        const x = padding + (chartWidth / years) * index;
        const y = height - padding - (value / maxValue) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels (years)
    for (let i = 0; i <= years; i++) {
        const x = padding + (chartWidth / years) * i;
        ctx.fillText(`Year ${i}`, x, height - padding + 20);
    }
    
    // Y-axis labels (values)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        const value = maxValue - (maxValue / 5) * i;
        ctx.fillText(`Rs.${value.toFixed(0)}`, padding - 10, y + 5);
    }
    
    // Title
    ctx.fillStyle = '#e8b4e8';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Asset Value Depreciation Over Time', width / 2, 25);
}

async function loadHistory() {
    if (historyLoaded) return;
    
    const loadingHistory = document.getElementById('loadingHistory');
    const noHistory = document.getElementById('noHistory');
    const historyList = document.getElementById('historyList');
    
    loadingHistory.style.display = 'block';
    noHistory.style.display = 'none';
    historyList.style.display = 'none';
    
    try {
        const response = await fetch(`/api/assets/${assetId}/audit`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.logs && data.logs.length > 0) {
            displayHistory(data.logs);
            historyLoaded = true;
        } else {
            noHistory.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading history:', error);
        noHistory.textContent = 'Failed to load change history';
        noHistory.style.display = 'block';
    } finally {
        loadingHistory.style.display = 'none';
    }
}

// Display history
function displayHistory(logs) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const actionClass = getActionClass(log.action);
        const actionLabel = formatAction(log.action);
        
        item.innerHTML = `
            <div class="history-header">
                <div>
                    <span class="action-badge ${actionClass}">${actionLabel}</span>
                    <span class="history-action">${log.action.replace(/_/g, ' ')}</span>
                </div>
                <div class="history-time">${new Date(log.timestamp).toLocaleString()}</div>
            </div>
            <div class="history-user">By: ${log.user_name || log.username || 'Unknown User'}</div>
            <div class="history-details">${log.details || 'No details available'}</div>
        `;
        
        historyList.appendChild(item);
    });
    
    historyList.style.display = 'flex';
}

// Get action class for badge
function getActionClass(action) {
    if (action.includes('CREATE')) return 'action-create';
    if (action.includes('UPDATE')) return 'action-update';
    if (action.includes('DELETE')) return 'action-delete';
    if (action.includes('STATUS')) return 'action-status';
    if (action.includes('ASSIGN')) return 'action-assign';
    return 'action-update';
}

// Format action label
function formatAction(action) {
    if (action.includes('CREATE')) return 'CREATE';
    if (action.includes('UPDATE')) return 'UPDATE';
    if (action.includes('DELETE')) return 'DELETE';
    if (action.includes('STATUS')) return 'STATUS';
    if (action.includes('ASSIGN')) return 'ASSIGN';
    return 'ACTION';
}

// Load asset details on page load
window.addEventListener('DOMContentLoaded', () => {
    loadAssetDetails();
});
