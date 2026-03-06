const signupForm = document.getElementById('signupForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const passkey = document.getElementById('passkey').value;
    
    // Hide previous messages
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    // Disable button during request
    const submitBtn = signupForm.querySelector('.signin-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, role, passkey })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message
            successMessage.textContent = data.message || 'Account created successfully! Redirecting to login...';
            successMessage.classList.add('show');
            
            // Clear form
            signupForm.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/views/login.html';
            }, 2000);
        } else {
            // Show error message
            errorMessage.textContent = data.message || 'Sign up failed. Please try again.';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Signup error:', error);
        errorMessage.textContent = 'Connection error. Please check if the server is running.';
        errorMessage.classList.add('show');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
    }
});
