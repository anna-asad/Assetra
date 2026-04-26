// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/views/login.html';
}

// User info
const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.fullName || user.username || 'User';

let dapartments = null;

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/views/login.html';
});

async function loadDistributionData() {
    const loading = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    
    loading.style.display = 'block';
    errorEl.style.display = 'none';
    
    try {
        const response = await fetch('/api/dashboard/asset-distribution', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Handle Manager role - show single department chart
            if (user.role === 'Manager') {
                if (data.distribution.length > 0) {
                    renderSingleDeptChart(data.distribution[0]);
                    document.getElementById('departmentInfo').textContent = `My Department: ${data.distribution[0].department}`;
                } else {
                    document.getElementById('error').textContent = 'No department data found for your account.';
                    document.getElementById('error').style.display = 'block';
                }
            } else {
                // Admin/Viewer - show all departments
                renderDapartmentsChart(data.distribution);
                document.getElementById('departmentInfo').textContent = 'All Departments - Admin View';
            }
        } else {
            throw new Error(data.message || 'Failed to load data');
        }
    } catch (error) {
        console.error('Error:', error);
        errorEl.textContent = 'Error loading data: ' + error.message;
        errorEl.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function renderDapartmentsChart(allDistribution) {
    const ctx = document.getElementById('dapartments').getContext('2d');

    if (dapartments) {
        dapartments.destroy();
    }

    const labels = ['Available', 'Allocated', 'Maintenance', 'Missing'];
    const departments = allDistribution.map(d => d.department);

    const datasets = labels.map(label => ({
        label,
        data: departments.map(dept => {
            const deptData = allDistribution.find(d => d.department === dept);
            return deptData ? deptData[label] || 0 : 0;
        }),
        backgroundColor: getStatusColor(label),
        borderColor: getStatusColor(label),
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.85
    }));

    dapartments = new Chart(ctx, {
        type: 'bar',
        data: { labels: departments, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '📊 All Departments',
                    font: { size: 24, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: { font: { size: 16 } }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Assets', font: { size: 16 } },
                    ticks: { font: { size: 14 } }
                },
                x: {
                    title: { display: true, text: 'Departments', font: { size: 16 } },
                    ticks: { font: { size: 14 } }
                }
            }
        }
    });
}

function getStatusColor(status) {
    const colors = {
        'Available': 'rgba(27, 183, 106, 0.8)',
        'Allocated': 'rgba(0, 123, 255, 0.8)',
        'Maintenance': 'rgba(255, 193, 7, 0.8)',
        'Missing': 'rgba(220, 53, 69, 0.8)'
    };
    return colors[status] || 'rgba(108, 117, 125, 0.8)';
}

// Load data on page load
document.addEventListener('DOMContentLoaded', loadDistributionData);
