// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/views/login.html';
}

// User info
const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.fullName || user.username || 'User';

let academicChart = null;
let adminChart = null;

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
            const academicDepts = ['Computer Science', 'Electrical Engineering', 'Civil Engineering', 'Management Sciences', 'Sciences & Humanities IT Services'];
            const academicData = data.distribution.filter(d => academicDepts.includes(d.department));
            const adminData = data.distribution.filter(d => !academicDepts.includes(d.department));
            
            renderAcademicChart(academicData, data.distribution);
            renderAdminChart(adminData, data.distribution);
            document.getElementById('departmentInfo').textContent = 'All Departments - Admin View';
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

function renderAcademicChart(academicData, allDistribution) {
    const ctx = document.getElementById('academicChart').getContext('2d');
    
    if (academicChart) {
        academicChart.destroy();
    }
    
    const labels = ['Available', 'Allocated', 'Maintenance', 'Missing'];
    const departments = academicData.map(d => d.department);
    
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
    
    academicChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: departments, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '🎓 Academic Departments',
                    font: { size: 18, weight: 'bold' }
                },
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Assets' }
                },
                x: { title: { display: true, text: 'Departments' } }
            }
        }
    });
}

function renderAdminChart(adminData, allDistribution) {
    const ctx = document.getElementById('adminChart').getContext('2d');
    
    if (adminChart) {
        adminChart.destroy();
    }
    
    const labels = ['Available', 'Allocated', 'Maintenance', 'Missing'];
    const departments = adminData.map(d => d.department);
    
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
    
    adminChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: departments, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '🏢 Administrative Departments',
                    font: { size: 18, weight: 'bold' }
                },
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Assets' }
                },
                x: { title: { display: true, text: 'Departments' } }
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
