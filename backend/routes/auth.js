const express = require('express');
const router = express.Router();
const { login, logout, signup, getAllUsers, getUserStats, deleteUser, getUserById, updateUser, resetPassword, getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/authController');
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

// GET /api/auth/users/:id - Admin only
router.get('/users/:id', authenticateToken, roleCheck(['Admin']), getUserById);

// PATCH /api/auth/users/:id - Admin only
router.patch('/users/:id', authenticateToken, roleCheck(['Admin']), updateUser);

// POST /api/auth/users/:id/reset-password - Admin only
router.post('/users/:id/reset-password', authenticateToken, roleCheck(['Admin']), resetPassword);

// DELETE /api/auth/users/:id - Admin only
router.delete('/users/:id', authenticateToken, roleCheck(['Admin']), deleteUser);

// Department routes - Admin only
router.get('/departments', authenticateToken, roleCheck(['Admin']), getDepartments);
router.post('/departments', authenticateToken, roleCheck(['Admin']), createDepartment);
router.patch('/departments/:id', authenticateToken, roleCheck(['Admin']), updateDepartment);
router.delete('/departments/:id', authenticateToken, roleCheck(['Admin']), deleteDepartment);

module.exports = router;
