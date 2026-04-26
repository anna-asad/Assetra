const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/views/login.html';
}

if (user.role !== 'Admin') {
    window.location.href = '/views/dashboard.html';
}

document.getElementById('userName').textContent = user.fullName || user.username || 'User';

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

let allUsers = [];
let allDepartments = [];

// Tab switching
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
    
    if (tab === 'users') {
        loadUsers();
    } else {
        loadDepartments();
    }
}

// Load users
async function loadUsers() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const tableContainer = document.getElementById('usersTableContainer');
    
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    tableContainer.style.display = 'none';
    
    try {
        const response = await fetch('/api/auth/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
            displayUsers(allUsers);
        } else {
            errorMessage.textContent = data.message || 'Failed to load users';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    const tableContainer = document.getElementById('usersTableContainer');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No users found</td></tr>';
        tableContainer.style.display = 'block';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
            <td>${user.department || '-'}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn edit" onclick="editUser(${user.user_id})" title="Edit">Edit</button>
                <button class="action-btn reset" onclick="openResetPassword(${user.user_id})" title="Reset Password">Reset</button>
                <button class="action-btn delete" onclick="deleteUser(${user.user_id})" title="Delete">Delete</button>
            </td>
        </tr>
    `).join('');
    
    tableContainer.style.display = 'block';
}

// User Modal
function openUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('password').required = true;
    document.getElementById('userModal').style.display = 'block';
    loadDepartmentOptions();
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function editUser(userId) {
    try {
        const response = await fetch(`/api/auth/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            document.getElementById('userModalTitle').textContent = 'Edit User';
            document.getElementById('userId').value = user.user_id;
            document.getElementById('username').value = user.username;
            document.getElementById('fullName').value = user.full_name;
            document.getElementById('email').value = user.email;
            document.getElementById('role').value = user.role;
            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('password').required = false;
            
            await loadDepartmentOptions();
            document.getElementById('department').value = user.department || '';
            toggleDepartment();
            
            document.getElementById('userModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        alert('Error loading user details');
    }
}

async function loadDepartmentOptions() {
    try {
        const response = await fetch('/api/auth/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const select = document.getElementById('department');
        select.innerHTML = '<option value="">Select Department</option>';
        
        if (data.success && data.departments) {
            data.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.department_name;
                option.textContent = dept.department_name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

function toggleDepartment() {
    const role = document.getElementById('role').value;
    const deptGroup = document.getElementById('departmentGroup');
    
    if (role === 'Admin' || role === 'Viewer') {
        deptGroup.style.display = 'none';
        document.getElementById('department').required = false;
    } else {
        deptGroup.style.display = 'block';
        document.getElementById('department').required = true;
    }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('username').value,
        full_name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        department: document.getElementById('department').value || null
    };
    
    if (!userId) {
        // Create new user
        userData.password = document.getElementById('password').value;
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            
            if (data.success) {
                closeUserModal();
                loadUsers();
                alert('User created successfully');
            } else {
                alert(data.message || 'Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Connection error');
        }
    } else {
        // Update existing user
        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            
            if (data.success) {
                closeUserModal();
                loadUsers();
                alert('User updated successfully');
            } else {
                alert(data.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Connection error');
        }
    }
});

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
        const response = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            loadUsers();
            alert('User deactivated successfully');
        } else {
            alert(data.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Connection error');
    }
}

// Reset Password
function openResetPassword(userId) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('resetPasswordModal').style.display = 'block';
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').style.display = 'none';
}

document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('resetUserId').value;
    const newPassword = document.getElementById('newPassword').value;
    
    try {
        const response = await fetch(`/api/auth/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newPassword })
        });
        const data = await response.json();
        
        if (data.success) {
            closeResetPasswordModal();
            alert('Password reset successfully');
        } else {
            alert(data.message || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Connection error');
    }
});

// Departments
async function loadDepartments() {
    const loadingMessage = document.getElementById('deptLoadingMessage');
    const errorMessage = document.getElementById('deptErrorMessage');
    const tableContainer = document.getElementById('departmentsTableContainer');
    
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    tableContainer.style.display = 'none';
    
    try {
        const response = await fetch('/api/auth/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            allDepartments = data.departments || [];
            displayDepartments(allDepartments);
        } else {
            errorMessage.textContent = data.message || 'Failed to load departments';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

function displayDepartments(departments) {
    const tbody = document.getElementById('departmentsTableBody');
    const tableContainer = document.getElementById('departmentsTableContainer');
    
    if (departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No departments found</td></tr>';
        tableContainer.style.display = 'block';
        return;
    }
    
    tbody.innerHTML = departments.map(dept => `
        <tr>
            <td>${dept.department_id}</td>
            <td>${dept.department_name}</td>
            <td>
                <button class="action-btn edit" onclick="editDepartment(${dept.department_id}, '${dept.department_name}')" title="Edit">Edit</button>
                <button class="action-btn delete" onclick="deleteDepartment(${dept.department_id})" title="Delete">Delete</button>
            </td>
        </tr>
    `).join('');
    
    tableContainer.style.display = 'block';
}

function openDepartmentModal() {
    document.getElementById('deptModalTitle').textContent = 'Add Department';
    document.getElementById('departmentForm').reset();
    document.getElementById('departmentId').value = '';
    document.getElementById('departmentModal').style.display = 'block';
}

function closeDepartmentModal() {
    document.getElementById('departmentModal').style.display = 'none';
}

function editDepartment(deptId, deptName) {
    document.getElementById('deptModalTitle').textContent = 'Edit Department';
    document.getElementById('departmentId').value = deptId;
    document.getElementById('departmentName').value = deptName;
    document.getElementById('departmentModal').style.display = 'block';
}

document.getElementById('departmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deptId = document.getElementById('departmentId').value;
    const deptName = document.getElementById('departmentName').value.trim();
    
    try {
        let response;
        if (deptId) {
            response = await fetch(`/api/auth/departments/${deptId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ department_name: deptName })
            });
        } else {
            response = await fetch('/api/auth/departments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ department_name: deptName })
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            closeDepartmentModal();
            loadDepartments();
            alert(deptId ? 'Department updated successfully' : 'Department created successfully');
        } else {
            alert(data.message || 'Failed to save department');
        }
    } catch (error) {
        console.error('Error saving department:', error);
        alert('Connection error');
    }
});

async function deleteDepartment(deptId) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
        const response = await fetch(`/api/auth/departments/${deptId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            loadDepartments();
            alert('Department deleted successfully');
        } else {
            alert(data.message || 'Failed to delete department');
        }
    } catch (error) {
        console.error('Error deleting department:', error);
        alert('Connection error');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

