const express = require('express');
const router = express.Router();
const { login, logout, signup } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/logout
router.post('/logout', authenticateToken, logout);

module.exports = router;
