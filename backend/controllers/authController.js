const jwt = require('jsonwebtoken');
const { findUserByUsername, createUser, findUserByEmail, getAllUsersWithRoles, getUserCountsByRole, deleteUserById, getUserById, updateUser, resetPassword, getAllDepartments, createDepartment, updateDepartment, deleteDepartment, ensureProfilePictureColumn } = require('../models/database');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validation
    const errors = {};
    
    // Username validation
    if (!username || username.trim() === '') {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (username.length > 50) {
      errors.username = 'Username must not exceed 50 characters';
    }
    
    // Password validation (no minimum for login - allow existing users with short passwords)
    if (!password || password.trim() === '') {
      errors.password = 'Password is required';
    } else if (password.length > 255) {
      errors.password = 'Password is too long';
    }
    
    // Return validation errors
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(errors)[0],
        errors
      });
    }

    const user = await findUserByUsername(username.trim());
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
        department: user.department,
        createdAt: user.created_at,
        profilePicture: user.profile_picture || null
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

async function signup(req, res) {
  try {
    const { username, email, password, role, department, passkey } = req.body;

    // Validation
    const errors = {};
    
    // Username validation
    if (!username || username.trim() === '') {
      errors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (username.trim().length > 50) {
      errors.username = 'Username must not exceed 50 characters';
    }
    
    // Email validation
    if (!email || email.trim() === '') {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Invalid email format';
      } else if (email.trim().length > 100) {
        errors.email = 'Email must not exceed 100 characters';
      }
    }
    
    // Password validation
    if (!password || password.trim() === '') {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (password.length > 255) {
      errors.password = 'Password must not exceed 255 characters';
    }
    
    // Role validation
    if (!role || role.trim() === '') {
      errors.role = 'Role is required';
    } else if (!['Admin', 'Manager', 'Viewer'].includes(role)) {
      errors.role = 'Invalid role selected';
    }
    
    // Return validation errors
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(errors)[0],
        errors
      });
    }

    if (role !== 'Viewer' && !passkey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passkey is required for this role' 
      });
    }

    if (role !== 'Admin' && role !== 'Viewer' && (!department || department.trim() === '')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department is required for non-Admin and non-Viewer roles' 
      });
    }

    // Passkey validation based on role
    if (role === 'Admin' && passkey !== 'assetra2024') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid admin passkey' 
      });
    }

    if (role === 'Manager' && passkey !== 'manager2024') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid manager passkey' 
      });
    }

    const existingUser = await findUserByUsername(username.trim());
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already taken' 
      });
    }

    const existingEmail = await findUserByEmail(email.trim());
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const userData = {
      username: username.trim(),
      email: email.trim(),
      password,
      role,
      full_name: username.trim(),
      department: (role === 'Admin' || role === 'Viewer') ? null : department
    };

    const newUser = await createUser(userData);

    res.status(201).json({
      success: true,
      message: `Account created successfully as ${role}`,
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

async function getMyProfile(req, res) {
  try {
    const userId = req.user.userId;
    
    // Ensure the profile_picture column exists (will auto-create if missing)
    try {
      await ensureProfilePictureColumn();
    } catch (colError) {
      console.warn('Profile picture column check warning:', colError.message);
    }
    
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.created_at,
        profilePicture: user.profile_picture || null
      }
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile: ' + error.message });
  }
}

async function updateMyProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { full_name, email, profile_picture } = req.body;

    // Ensure the profile_picture column exists (will auto-create if missing)
    try {
      await ensureProfilePictureColumn();
    } catch (colError) {
      console.warn('Profile picture column check warning:', colError.message);
    }

    const updateData = {};
    if (typeof full_name === 'string') updateData.full_name = full_name.trim();
    if (typeof email === 'string') updateData.email = email.trim();
    if (typeof profile_picture === 'string') {
      updateData.profile_picture = profile_picture;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No profile fields provided' });
    }

    if (updateData.email) {
      const existing = await findUserByEmail(updateData.email);
      if (existing && existing.user_id !== userId) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
    }

    const updated = await updateUser(userId, updateData);

    res.json({
      success: true,
      user: {
        userId: updated.user_id,
        username: updated.username,
        fullName: updated.full_name,
        email: updated.email,
        role: updated.role,
        department: updated.department,
        createdAt: updated.created_at,
        profilePicture: updated.profile_picture || null
      }
    });
  } catch (error) {
    console.error('Update my profile error:', error);
    res.status(500).json({ success: false, message: 'Error updating profile: ' + error.message });
  }
}


async function getAllUsers(req, res) {
  try {
    const users = await getAllUsersWithRoles();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users: ' + error.message });
  }
}

async function getUserStats(req, res) {
  try {
    const counts = await getUserCountsByRole();
    res.json({ success: true, counts });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user stats: ' + error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;
    
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    
    const result = await deleteUserById(id);
    res.json(result);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Error deleting user: ' + error.message });
  }
}

async function getUserByIdController(req, res) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user: ' + error.message });
  }
}

async function updateUserController(req, res) {
  try {
    const { id } = req.params;
    const { full_name, email, role, department } = req.body;
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    
    const user = await updateUser(id, updateData);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Error updating user: ' + error.message });
  }
}

async function resetPasswordController(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    await resetPassword(id, newPassword);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password: ' + error.message });
  }
}

async function getDepartments(req, res) {
  try {
    const departments = await getAllDepartments();
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching departments: ' + error.message });
  }
}

async function createDepartmentController(req, res) {
  try {
    const { department_name } = req.body;
    if (!department_name || department_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }
    const department = await createDepartment(department_name.trim());
    res.status(201).json({ success: true, department });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Error creating department: ' + error.message });
  }
}

async function updateDepartmentController(req, res) {
  try {
    const { id } = req.params;
    const { department_name } = req.body;
    if (!department_name || department_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }
    const department = await updateDepartment(id, department_name.trim());
    res.json({ success: true, department });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Error updating department: ' + error.message });
  }
}

async function deleteDepartmentController(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteDepartment(id);
    res.json(result);
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Error deleting department: ' + error.message });
  }
}

module.exports = {
  login,
  logout,
  signup,
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserStats,
  deleteUser,
  getUserById: getUserByIdController,
  updateUser: updateUserController,
  resetPassword: resetPasswordController,
  getDepartments,
  createDepartment: createDepartmentController,
  updateDepartment: updateDepartmentController,
  deleteDepartment: deleteDepartmentController
};
