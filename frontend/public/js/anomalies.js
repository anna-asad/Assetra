// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

// Display user name
document.getElementById('userName').textContent = user.fullName || user.username || 'User';

let anomaliesData = null;
let filteredData = {
    missing: [],
    overdue: [],
    unused: [],
    patterns: []
};

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

// Load anomalies report
async function loadAnomaliesReport() {
    try {
        const response = await fetch('/api/anomalies/report', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        console.log('Anomalies Report:', result);

        if (result.success) {
            anomaliesData = result.data;
            displayAnomalies();
        } else {
            console.error('Failed to load anomalies:', result.message);
        }
    } catch (error) {
        console.error('Error loading anomalies:', error);
    }
}

function displayAnomalies() {
    if (!anomaliesData) return;

    const { summary, missing_assets, overdue_assets, unused_assets, suspicious_patterns } = anomaliesData;

    // Update summary
    document.getElementById('totalAnomalies').textContent = summary.total_anomalies;
    document.getElementById('criticalCount').textContent = anomaliesData.critical_count;
    document.getElementById('missingCount').textContent = summary.missing_assets_count;
    document.getElementById('overdueCount').textContent = summary.overdue_assets_count;
    document.getElementById('unusedCount').textContent = summary.unused_assets_count;
    document.getElementById('patternCount').textContent = summary.suspicious_patterns_count;

    // Display patterns
    if (suspicious_patterns && suspicious_patterns.length > 0) {
        document.getElementById('patternsSection').style.display = 'block';
        filteredData.patterns = suspicious_patterns;
        displayPatterns(suspicious_patterns);
    } else {
        document.getElementById('patternsSection').style.display = 'none';
    }

    // Display missing assets
    if (missing_assets && missing_assets.length > 0) {
        document.getElementById('missingSection').style.display = 'block';
        filteredData.missing = missing_assets;
        displayMissingAssets(missing_assets);
    } else {
        document.getElementById('missingSection').style.display = 'none';
    }

    // Display overdue assets
    if (overdue_assets && overdue_assets.length > 0) {
        document.getElementById('overdueSection').style.display = 'block';
        filteredData.overdue = overdue_assets;
        displayOverdueAssets(overdue_assets);
    } else {
        document.getElementById('overdueSection').style.display = 'none';
    }

    // Display unused assets
    if (unused_assets && unused_assets.length > 0) {
        document.getElementById('unusedSection').style.display = 'block';
        filteredData.unused = unused_assets;
        displayUnusedAssets(unused_assets);
    } else {
        document.getElementById('unusedSection').style.display = 'none';
    }
}

function displayPatterns(patterns) {
    const tbody = document.getElementById('patternsTableBody');
    const noData = document.getElementById('noPatterns');

    if (!patterns || patterns.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';
    tbody.innerHTML = patterns.map(pattern => `
        <tr>
            <td>${pattern.pattern_type}</td>
            <td>${pattern.department}</td>
            <td><strong>${pattern.count}</strong></td>
            <td>${pattern.threshold}</td>
            <td>
                <span class="severity-badge severity-${pattern.severity.toLowerCase()}">
                    ${pattern.severity}
                </span>
            </td>
            <td>${pattern.recommendation}</td>
        </tr>
    `).join('');
}

function displayMissingAssets(assets) {
    const tbody = document.getElementById('missingTableBody');
    const noData = document.getElementById('noMissing');

    if (!assets || assets.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';
    tbody.innerHTML = assets.map(asset => `
        <tr>
            <td><strong>${asset.asset_tag}</strong></td>
            <td>${asset.asset_name}</td>
            <td>${asset.department}</td>
            <td>${asset.category}</td>
            <td>${asset.days_missing} days</td>
            <td>₨${formatCurrency(asset.purchase_cost)}</td>
            <td>
                <span class="severity-badge severity-${asset.severity.toLowerCase()}">
                    ${asset.severity}
                </span>
            </td>
        </tr>
    `).join('');
}

function displayOverdueAssets(assets) {
    const tbody = document.getElementById('overdueTableBody');
    const noData = document.getElementById('noOverdue');

    if (!assets || assets.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';
    tbody.innerHTML = assets.map(asset => `
        <tr>
            <td><strong>${asset.asset_tag}</strong></td>
            <td>${asset.asset_name}</td>
            <td>${asset.assigned_to_name || 'Unassigned'}</td>
            <td>${asset.department}</td>
            <td>${asset.days_allocated} days</td>
            <td>₨${formatCurrency(asset.purchase_cost)}</td>
            <td>
                <span class="severity-badge severity-${asset.severity.toLowerCase()}">
                    ${asset.severity}
                </span>
            </td>
        </tr>
    `).join('');
}

function displayUnusedAssets(assets) {
    const tbody = document.getElementById('unusedTableBody');
    const noData = document.getElementById('noUnused');

    if (!assets || assets.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';
    tbody.innerHTML = assets.map(asset => `
        <tr>
            <td><strong>${asset.asset_tag}</strong></td>
            <td>${asset.asset_name}</td>
            <td>${asset.department}</td>
            <td>${asset.category}</td>
            <td>${asset.days_without_activity} days</td>
            <td>₨${formatCurrency(asset.purchase_cost)}</td>
            <td>
                <span class="severity-badge severity-${asset.severity.toLowerCase()}">
                    ${asset.severity}
                </span>
            </td>
        </tr>
    `).join('');
}

// Search and filter functionality
document.getElementById('missingSearch').addEventListener('input', (e) => {
    filterTable('missing', e.target.value, document.getElementById('missingSeverityFilter').value);
});

document.getElementById('missingSeverityFilter').addEventListener('change', (e) => {
    filterTable('missing', document.getElementById('missingSearch').value, e.target.value);
});

document.getElementById('overdueSearch').addEventListener('input', (e) => {
    filterTable('overdue', e.target.value, document.getElementById('overdueSeverityFilter').value);
});

document.getElementById('overdueSeverityFilter').addEventListener('change', (e) => {
    filterTable('overdue', document.getElementById('overdueSearch').value, e.target.value);
});

document.getElementById('unusedSearch').addEventListener('input', (e) => {
    filterTable('unused', e.target.value, document.getElementById('unusedSeverityFilter').value);
});

document.getElementById('unusedSeverityFilter').addEventListener('change', (e) => {
    filterTable('unused', document.getElementById('unusedSearch').value, e.target.value);
});

function filterTable(type, searchTerm, severity) {
    let data = filteredData[type];
    let filtered = data;

    if (searchTerm) {
        filtered = filtered.filter(item => {
            const searchStr = `${item.asset_tag || ''} ${item.asset_name || ''} ${item.pattern_type || ''}`.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
    }

    if (severity) {
        filtered = filtered.filter(item => item.severity === severity);
    }

    if (type === 'missing') {
        displayMissingAssets(filtered);
    } else if (type === 'overdue') {
        displayOverdueAssets(filtered);
    } else if (type === 'unused') {
        displayUnusedAssets(filtered);
    }
}

// Export report functionality
document.getElementById('exportBtn').addEventListener('click', () => {
    if (!anomaliesData) return;

    const report = generateReport();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `anomaly-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
});

function generateReport() {
    const { summary, missing_assets, overdue_assets, unused_assets, suspicious_patterns } = anomaliesData;
    const timestamp = new Date().toLocaleString();

    let report = `ASSETRA - ANOMALY DETECTION REPORT\n`;
    report += `Generated: ${timestamp}\n`;
    report += `${'='.repeat(60)}\n\n`;

    report += `SUMMARY\n`;
    report += `${'─'.repeat(60)}\n`;
    report += `Total Anomalies: ${summary.total_anomalies}\n`;
    report += `Critical Issues: ${anomaliesData.critical_count}\n`;
    report += `Missing Assets: ${summary.missing_assets_count}\n`;
    report += `Overdue Assets: ${summary.overdue_assets_count}\n`;
    report += `Unused Assets: ${summary.unused_assets_count}\n`;
    report += `Suspicious Patterns: ${summary.suspicious_patterns_count}\n\n`;

    if (suspicious_patterns && suspicious_patterns.length > 0) {
        report += `SUSPICIOUS PATTERNS\n`;
        report += `${'─'.repeat(60)}\n`;
        suspicious_patterns.forEach(pattern => {
            report += `• ${pattern.pattern_type}\n`;
            report += `  Department: ${pattern.department}\n`;
            report += `  Count: ${pattern.count} (Threshold: ${pattern.threshold})\n`;
            report += `  Severity: ${pattern.severity}\n`;
            report += `  Recommendation: ${pattern.recommendation}\n\n`;
        });
    }

    if (missing_assets && missing_assets.length > 0) {
        report += `MISSING ASSETS\n`;
        report += `${'─'.repeat(60)}\n`;
        missing_assets.forEach(asset => {
            report += `• ${asset.asset_tag} - ${asset.asset_name}\n`;
            report += `  Department: ${asset.department}\n`;
            report += `  Days Missing: ${asset.days_missing}\n`;
            report += `  Value: ₨${formatCurrency(asset.purchase_cost)}\n`;
            report += `  Severity: ${asset.severity}\n\n`;
        });
    }

    if (overdue_assets && overdue_assets.length > 0) {
        report += `OVERDUE ASSETS\n`;
        report += `${'─'.repeat(60)}\n`;
        overdue_assets.forEach(asset => {
            report += `• ${asset.asset_tag} - ${asset.asset_name}\n`;
            report += `  Assigned To: ${asset.assigned_to_name || 'Unassigned'}\n`;
            report += `  Days Allocated: ${asset.days_allocated}\n`;
            report += `  Department: ${asset.department}\n`;
            report += `  Severity: ${asset.severity}\n\n`;
        });
    }

    if (unused_assets && unused_assets.length > 0) {
        report += `UNUSED ASSETS\n`;
        report += `${'─'.repeat(60)}\n`;
        unused_assets.forEach(asset => {
            report += `• ${asset.asset_tag} - ${asset.asset_name}\n`;
            report += `  Department: ${asset.department}\n`;
            report += `  Days Without Activity: ${asset.days_without_activity}\n`;
            report += `  Severity: ${asset.severity}\n\n`;
        });
    }

    return report;
}

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadAnomaliesReport();
});

// Currency formatting
function formatCurrency(value) {
    return new Intl.NumberFormat('en-PK').format(value || 0);
}

// Load data on page load
window.addEventListener('DOMContentLoaded', loadAnomaliesReport);
