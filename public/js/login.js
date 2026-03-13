const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');//this is  grabbing an element "errormessage" from html

//waits for event "submit" to be clicked
// asynch tells await can be used ie ui can wait for things to be fetched from db

loginForm.addEventListener('submit', async (e) => 
    {
    e.preventDefault();// normally, submitting a form reloads the page. This line stops that
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // hidee previous error
    errorMessage.classList.remove('show');//hides the error box if it was visible.
    errorMessage.textContent = '';
    
    // Disable button during request
    const submitBtn = loginForm.querySelector('.signin-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        const response = await fetch('/api/auth/login', //fetch sends an HTTP request to your server
            {
            method: 'POST',//sending data.
            headers: {
                'Content-Type': 'application/json'//tells the server we’re sending JSON.
            },
            body: JSON.stringify({ username, password })//converts { username, password } into JSON text.
        });
        
        //waits for the server and Converts the server’s reply into a JavaScript object.
        const data = await response.json();
        
        if (data.success) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = '/views/dashboard.html';
        } else {
            // Show error message
            errorMessage.textContent = data.message || 'Login failed. Please try again.';
            errorMessage.classList.add('show');
        }
    } catch (error) 
    {
        console.error('Login error:', error);
        errorMessage.textContent = 'Connection error. Please check if the server is running.';
        errorMessage.classList.add('show');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
    }
});

// Check if already logged in
//window is a global object
//this works when we refresh the page 
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');//checks if a login token exists.
    // If yes then the user is already authenticated,
    //so skip the login page and redirect them to the dashboard.
    if (token) {
        // redirect to dashboard if user is already logged in
        window.location.href = '/views/dashboard.html';
    }
});
