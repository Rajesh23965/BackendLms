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
  verifyAndRefreshToken,
  forgetPassword,
  resetPassword,
  changePassword,
} = require('../controllers/userController');
const { isAdmin, isAuthenticated } = require('../middlewares/authMiddleware.js');

// Public Routes
router.post('/login', login);
router.post('/logout', Logout);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyAndRefreshToken, changePassword);

// Authenticated User Routes
router.use(verifyAndRefreshToken); 

router.get('/profile', CheckUser);

router.get('/all', getAllUsers);
// Admin Routes
router.use(isAuthenticated, isAdmin); 

router.get('/searchAll', getAllUsers);
router.post('/create', createUser);
router.get('/search', searchUsers);
router.get('/:userId', getUserById);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);

module.exports = router;
