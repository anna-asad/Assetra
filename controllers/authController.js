const jwt = require('jsonwebtoken');
const { findUserByUsername, createUser, findUserByEmail } = require('../models/database');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter username and password' 
      });
    }

    const user = await findUserByUsername(username);
    if (!user || password !== user.password_hash) {
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
      message: 'Error logging in: ' + error.message 
    });
  }
}

async function logout(req, res) {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error logging out: ' + error.message 
    });
  }
}

module.exports = {
  login,
  logout
};


async function signup(req, res) {
  try {
    const { username, email, password, role, department, passkey } = req.body;

    if (!username || !email || !password || !role || !department || !passkey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all fields' 
      });
    }

    if (passkey !== 'assetra2024') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid passkey' 
      });
    }

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already taken' 
      });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const newUser = await createUser({
      username,
      email,
      password,
      role,
      full_name: username,
      department
    });

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
      message: 'Error creating account: ' + error.message 
    });
  }
}

module.exports = {
  login,
  logout,
  signup
};
