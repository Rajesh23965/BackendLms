const express = require('express');
const router = express.Router();
const { 
  createUser, 
  searchUsers,
  login,
  Logout,
  getUserById, 
  getAllUsers, 
  deleteUser, 
  updateUser,
  CheckUser,
  verifyAndRefreshToken
} = require('../controllers/userController');
const { isAdmin, isAuthenticated } = require('../middlewares/authMiddleware.js');

router.get('/searchAll',isAuthenticated,isAdmin,  getAllUsers); 

// Create user (Admin only)
router.post('/create', isAuthenticated, isAdmin, createUser);
//Search user (Admin only)
router.get('/search', searchUsers);

// Login (public)
router.post('/login', login);

// Logout (public)
router.post('/logout', Logout);

// Check authenticated user
router.get('/profile', verifyAndRefreshToken, CheckUser);

// Get all users (Admin only)
router.get('/all',  getAllUsers);

// Get user by ID (Admin and Student)
router.get('/:userId', isAuthenticated, getUserById);

// Update user by ID (Admin only, use PUT for updating resources)
router.put('/:userId', isAuthenticated, isAdmin, updateUser);

// Delete user (Admin only)
router.delete('/:userId', isAuthenticated, isAdmin, deleteUser);

module.exports = router;
