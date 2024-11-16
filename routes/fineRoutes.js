// routes/fineRoutes.js
const express = require('express');
const router = express.Router();
const {
  createFine,
  updateFine,
  deleteFine,
  getUserFines
} = require('../controllers/fineController');

const { isAdmin, isAuthenticated } = require('../middlewares/authMiddleware.js');

// Admin Routes
router.post('/create', isAuthenticated, isAdmin, createFine); // Create a fine
router.put('/:fineId', isAuthenticated, isAdmin, updateFine); // Update a fine
router.delete('/:fineId', isAuthenticated, isAdmin, deleteFine); // Delete a fine

// Student Route
router.get('/myfines', isAuthenticated, getUserFines); // Get all fines for logged-in user

module.exports = router;
