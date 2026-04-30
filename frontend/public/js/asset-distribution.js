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

    // Create gradient colors for bars (matching dashboard bar colors)
    const gradientColors = [
        { start: '#f86bad', end: '#ee4189' },  // Pink for Available
        { start: '#816ad3', end: '#7240fa' },  // Purple for Allocated
        { start: '#b755f0', end: '#b12fd8' },  // Violet for Maintenance
        { start: '#fa3bda', end: '#ff007f' }   // Magenta for Missing
    ];
    const boxShadowColors = ['rgb(223, 32, 143)', 'rgb(156, 88, 212)', 'rgb(176, 105, 218)', 'rgb(250, 59, 218)'];

    const datasets = labels.map((label, index) => {
        const color = gradientColors[index];
        return {
            label,
            data: departments.map(dept => {
                const deptData = allDistribution.find(d => d.department === dept);
                return deptData ? deptData[label] || 0 : 0;
            }),
            backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return color.start;
                // Create gradient
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, color.start);
                gradient.addColorStop(1, color.end);
                return gradient;
            },
            borderColor: boxShadowColors[index], // Use box-shadow color for border
            borderWidth: 2,
            barPercentage: 0.8,
            categoryPercentage: 0.85,
            borderRadius: 8,
            borderSkipped: false
        };
    });

    dapartments = new Chart(ctx, {
        type: 'bar',
        data: { labels: departments, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                title: {
                    display: true,
                    text: '📊 All Departments',
                    font: { size: 24, weight: 'bold' },
                    color: '#e8b4e8'
                },
                legend: {
                    position: 'top',
                    labels: { font: { size: 16 }, color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Assets', font: { size: 16 }, color: '#ffffff' },
                    ticks: { font: { size: 14 }, color: '#ffffff' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    title: { display: true, text: 'Departments', font: { size: 16 }, color: '#ffffff' },
                    ticks: { font: { size: 14 }, color: '#ffffff' },
                    grid: { display: false }
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
