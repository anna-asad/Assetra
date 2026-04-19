function renderSingleDeptChart(deptData) {
    // Hide both charts
    document.getElementById('academicChart').closest('.chart-card').style.display = 'none';
    document.getElementById('adminChart').closest('.chart-card').style.display = 'none';
    
    // Create single chart container
    let singleChartContainer = document.getElementById('singleDeptChart');
    if (!singleChartContainer) {
        const chartsRow = document.querySelector('.charts-row');
        singleChartContainer = document.createElement('div');
        singleChartContainer.id = 'singleDeptChartContainer';
        singleChartContainer.className = 'chart-card single-dept-chart';
        singleChartContainer.innerHTML = `
            <h3>📊 My Department: ${deptData.department}</h3>
            <div style="height: 500px; position: relative;">
                <canvas id="singleDeptChart"></canvas>
            </div>
        `;
        chartsRow.appendChild(singleChartContainer);
    }
    
    const ctx = document.getElementById('singleDeptChart').getContext('2d');
    const labels = ['Available', 'Allocated', 'Maintenance', 'Missing'];
    const dataValues = labels.map(label => deptData[label] || 0);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: dataValues,
                backgroundColor: [
                    'rgba(27, 183, 106, 0.8)',
                    'rgba(0, 123, 255, 0.8)', 
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: ['#1bb76a', '#007bff', '#ffc107', '#dc3545'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Total Assets: ${deptData.total}`,
                    font: { size: 16 }
                },
                legend: { position: 'bottom' }
            }
        }
    });
}
