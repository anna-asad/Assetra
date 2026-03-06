const jwt = require('jsonwebtoken');
const { findUserByUsername, createUser, findUserByEmail } = require('../models/userModel');
const { logAction } = require('../models/auditModel');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Find user
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Verify password (plain text for development)
    if (password !== user.password_hash) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id,
        username: user.username,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Log the login action
    await logAction(user.user_id, 'LOGIN', 'user', user.user_id, 'User logged in');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
}

async function logout(req, res) {
  try {
    // Log the logout action
    await logAction(req.user.userId, 'LOGOUT', 'user', req.user.userId, 'User logged out');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
}

module.exports = {
  login,
  logout
};


async function signup(req, res) {
  try {
    const { username, email, password, role, passkey } = req.body;

    // Validate input
    if (!username || !email || !password || !role || !passkey) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate passkey (simple check - you can make this more secure)
    if (passkey !== 'assetra2024') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid passkey' 
      });
    }

    // Validate role
    if (role !== 'Admin' && role !== 'Manager') {
      return res.status(400).json({ 
        success: false, 
        message: 'Role must be Admin or Manager' 
      });
    }

    // Check if username already exists
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Check if email already exists
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Create user (password stored as plain text for now)
    const newUser = await createUser({
      username,
      email,
      password,
      role,
      full_name: username,
      department: role === 'Admin' ? 'IT' : 'Operations'
    });

    // Log the signup action
    await logAction(newUser.user_id, 'SIGNUP', 'user', newUser.user_id, 'New user registered');

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        userId: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sign up failed. Please try again.' 
    });
  }
}

module.exports = {
  login,
  logout,
  signup
};
