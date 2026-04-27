const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

async function loadDisposalRequests() {
    const tbody = document.getElementById('disposalTableBody');
    
    try {
        const response = await fetch('/api/assets/disposal-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            if (!data.requests || data.requests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No disposal requests found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.requests.map(req => `
                <tr>
                    <td>${req.asset_tag || '-'}</td>
                    <td>${req.asset_name || '-'}</td>
                    <td>${req.requested_by_name || 'System'}</td>
                    <td>${req.reason || '-'}</td>
                    <td>${req.suggested_method || '-'}</td>
                    <td>Level ${req.current_level || 1}</td>
                    <td><span class="status-badge status-${(req.status || 'pending').toLowerCase()}">${req.status || 'Pending'}</span></td>
                    <td>
                        ${req.status === 'Pending' || req.status === 'Under Review' ? `
                            <button class="action-btn" onclick="processApproval(${req.request_id}, 'Approved', ${req.current_level})">Approve</button>
                            <button class="action-btn remove-btn" onclick="processApproval(${req.request_id}, 'Rejected', ${req.current_level})">Reject</button>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: red; padding: 20px;">Error: ${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading disposal requests:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: red; padding: 20px;">Failed to connect to server.</td></tr>';
    }
}

async function processApproval(requestId, status, level) {
    const comments = prompt(`Enter comments for ${status.toLowerCase()}:`);
    if (comments === null) return;

    try {
        const response = await fetch('/api/assets/disposal-approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                request_id: requestId,
                status,
                comments,
                level
            })
        });
        const data = await response.json();
        if (data.success) {
            alert(`Request ${status.toLowerCase()} successfully`);
            loadDisposalRequests();
        }
    } catch (error) {
        console.error('Error processing approval:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userName').textContent = user.fullName || user.username || 'User';
    loadDisposalRequests();
});