const express = require('express');
const router = express.Router();
const { login, logout, signup, getAllUsers, getUserStats, deleteUser } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/logout
router.post('/logout', authenticateToken, logout);

// GET /api/auth/users - Admin only
router.get('/users', authenticateToken, roleCheck(['Admin']), getAllUsers);

// GET /api/auth/users/stats - Admin only
router.get('/users/stats', authenticateToken, roleCheck(['Admin']), getUserStats);

// DELETE /api/auth/users/:id - Admin only
router.delete('/users/:id', authenticateToken, roleCheck(['Admin']), deleteUser);

module.exports = router;
