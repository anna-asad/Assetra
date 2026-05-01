// Login Form Validation and Submission
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');

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

function validatePassword(password) {
    if (!password || password.trim() === '') {
        return 'Password is required';
    }
    if (password.length > 255) {
        return 'Password is too long';
    }
    // No minimum length for login - allow existing users with short passwords
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

function updateSubmitButton() {
    const usernameError = validateUsername(usernameInput.value);
    const passwordError = validatePassword(passwordInput.value);
    
    if (usernameError || passwordError) {
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
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
    
    // Validate all fields
    const usernameError = validateUsername(usernameInput.value);
    const passwordError = validatePassword(passwordInput.value);
    
    if (usernameError || passwordError) {
        errorMessage.textContent = usernameError || passwordError;
        errorMessage.classList.add('show');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                password: passwordInput.value
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = '/views/dashboard.html';
        } else {
            errorMessage.textContent = data.message || 'Login failed';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
    }
});

// Initial button state
updateSubmitButton();
