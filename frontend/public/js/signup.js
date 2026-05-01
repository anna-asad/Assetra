// Signup Form Validation and Submission
const signupForm = document.getElementById('signupForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const roleSelect = document.getElementById('role');
const departmentSelect = document.getElementById('department');
const passkeyInput = document.getElementById('passkey');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Validation functions
function validateUsername(username) {
    if (!username || username.trim() === '') {
        return 'Username is required';
    }
    if (username.length < 3) {
        return 'Username must be at least 3 characters';
    }
    if (username.length > 50) {
        return 'Username must not exceed 50 characters';
    }
    return '';
}

function validateEmail(email) {
    if (!email || email.trim() === '') {
        return 'Email is required';
    }
    
    // Check for @ symbol
    if (!email.includes('@')) {
        return 'Invalid email format (missing @)';
    }
    
    // Check for dot after @
    const atIndex = email.indexOf('@');
    const dotAfterAt = email.indexOf('.', atIndex);
    if (dotAfterAt === -1) {
        return 'Invalid email format (missing domain extension)';
    }
    
    // Check for double @@
    if (email.includes('@@')) {
        return 'Invalid email format (double @)';
    }
    
    // Check for text after @
    const domain = email.substring(atIndex + 1);
    if (domain.length < 3) {
        return 'Invalid email format (incomplete domain)';
    }
    
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Invalid email format';
    }
    
    if (email.length > 100) {
        return 'Email must not exceed 100 characters';
    }
    
    return '';
}

function validatePassword(password) {
    if (!password || password.trim() === '') {
        return 'Password is required';
    }
    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    if (password.length > 255) {
        return 'Password must not exceed 255 characters';
    }
    return '';
}

function validateRole(role) {
    if (!role || role === '') {
        return 'Please select a role';
    }
    return '';
}

function validateDepartment(role, department) {
    if (role !== 'Admin' && role !== 'Viewer' && (!department || department === '')) {
        return 'Department is required for Manager role';
    }
    return '';
}

// Real-time validation
usernameInput.addEventListener('input', () => {
    const error = validateUsername(usernameInput.value);
    document.getElementById('usernameError').textContent = error;
    if (error) {
        usernameInput.classList.add('invalid');
        usernameInput.classList.remove('valid');
    } else {
        usernameInput.classList.remove('invalid');
        usernameInput.classList.add('valid');
    }
    updateSubmitButton();
});

emailInput.addEventListener('input', () => {
    const error = validateEmail(emailInput.value);
    document.getElementById('emailError').textContent = error;
    if (error) {
        emailInput.classList.add('invalid');
        emailInput.classList.remove('valid');
    } else {
        emailInput.classList.remove('invalid');
        emailInput.classList.add('valid');
    }
    updateSubmitButton();
});

passwordInput.addEventListener('input', () => {
    const error = validatePassword(passwordInput.value);
    document.getElementById('passwordError').textContent = error;
    if (error) {
        passwordInput.classList.add('invalid');
        passwordInput.classList.remove('valid');
    } else {
        passwordInput.classList.remove('invalid');
        passwordInput.classList.add('valid');
    }
    updateSubmitButton();
});

roleSelect.addEventListener('change', () => {
    const error = validateRole(roleSelect.value);
    document.getElementById('roleError').textContent = error;
    if (error) {
        roleSelect.classList.add('invalid');
        roleSelect.classList.remove('valid');
    } else {
        roleSelect.classList.remove('invalid');
        roleSelect.classList.add('valid');
    }
    
    // Check department requirement
    const deptError = validateDepartment(roleSelect.value, departmentSelect.value);
    document.getElementById('departmentError').textContent = deptError;
    
    updateSubmitButton();
});

departmentSelect.addEventListener('change', () => {
    const deptError = validateDepartment(roleSelect.value, departmentSelect.value);
    document.getElementById('departmentError').textContent = deptError;
    if (deptError) {
        departmentSelect.classList.add('invalid');
        departmentSelect.classList.remove('valid');
    } else {
        departmentSelect.classList.remove('invalid');
        departmentSelect.classList.add('valid');
    }
    updateSubmitButton();
});

function updateSubmitButton() {
    const usernameError = validateUsername(usernameInput.value);
    const emailError = validateEmail(emailInput.value);
    const passwordError = validatePassword(passwordInput.value);
    const roleError = validateRole(roleSelect.value);
    const deptError = validateDepartment(roleSelect.value, departmentSelect.value);
    
    if (usernameError || emailError || passwordError || roleError || deptError) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
    } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
}

// Form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
    successMessage.textContent = '';
    successMessage.classList.remove('show');
    
    // Validate all fields
    const usernameError = validateUsername(usernameInput.value);
    const emailError = validateEmail(emailInput.value);
    const passwordError = validatePassword(passwordInput.value);
    const roleError = validateRole(roleSelect.value);
    const deptError = validateDepartment(roleSelect.value, departmentSelect.value);
    
    if (usernameError || emailError || passwordError || roleError || deptError) {
        errorMessage.textContent = usernameError || emailError || passwordError || roleError || deptError;
        errorMessage.classList.add('show');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value,
                role: roleSelect.value,
                department: departmentSelect.value || null,
                passkey: passkeyInput.value || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMessage.textContent = data.message || 'Account created successfully! Redirecting to login...';
            successMessage.classList.add('show');
            
            // Reset form
            signupForm.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/views/login.html';
            }, 2000);
        } else {
            errorMessage.textContent = data.message || 'Signup failed';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Signup error:', error);
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
});

// Initial button state
updateSubmitButton();
