const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) window.location.href = '/views/login.html';

document.getElementById('userName').textContent = user.fullName || user.username;

// Hide request form for Admin and Manager (only Viewers can submit requests)
if (user.role === 'Admin' || user.role === 'Manager') {
    const requestFormCard = document.querySelector('.request-form-card');
    if (requestFormCard) {
        requestFormCard.style.display = 'none';
    }
}

async function loadRequests() {
    try {
        const response = await fetch('/api/assets/asset-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('requestsTableBody');
        if (data.success) {
            tbody.innerHTML = data.requests.map(req => `
                <tr>
                    <td>${req.asset_name}</td>
                    <td>${req.category}</td>
                    <td>${req.department}</td>
                    <td>${req.requested_by_name}</td>
                    <td><span class="status-badge status-${req.status.toLowerCase()}">${req.status}</span></td>
                    <td>${new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                        ${(req.status === 'Pending' && (user.role === 'Admin' || user.role === 'Manager')) ? `
                            <button class="action-btn" onclick="processRequest(${req.request_id}, 'Approved')">Approve</button>
                            <button class="action-btn remove-btn" onclick="processRequest(${req.request_id}, 'Rejected')">Reject</button>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadDepartments() {
    try {
        const response = await fetch('/api/auth/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const select = document.getElementById('reqDept');
        if (select) {
            select.innerHTML = '<option value="">Select Department</option>';
            if (data.success && data.departments) {
                data.departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.department_name;
                    option.textContent = dept.department_name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

document.getElementById('assetRequestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const payload = {
        asset_name: document.getElementById('reqName').value,
        category: document.getElementById('reqCategory').value,
        department: document.getElementById('reqDept').value
    };

    try {
        const res = await fetch('/api/assets/asset-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            toast.success('Request submitted successfully!');
            e.target.reset();
            loadRequests();
            // Update sidebar badge
            if (window.updateAssetRequestBadge) {
                window.updateAssetRequestBadge();
            }
        } else {
            toast.error(data.message || 'Failed to submit request');
        }
    } catch (err) {
        toast.error('Error submitting request');
    } finally {
        btn.disabled = false;
    }
});

async function processRequest(id, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
    
    try {
        const res = await fetch(`/api/assets/asset-requests/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            toast.success(`Request ${status.toLowerCase()} successfully!`);
            loadRequests();
            // Update sidebar badge
            if (window.updateAssetRequestBadge) {
                window.updateAssetRequestBadge();
            }
        } else {
            toast.error(data.message || 'Failed to process request');
        }
    } catch (err) {
        toast.error('Error processing request');
    }
}

loadRequests();
loadDepartments();

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/views/login.html';
    }
});
