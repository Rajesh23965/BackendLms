const express = require('express');
const router = express.Router();
const { 
  issueLibraryCard, 
  editLibraryCard, 
  deleteLibraryCard, 
  requestLibraryCard, 
  getLibraryCard, 
  isAdmin 
} = require('../controllers/librarycardController.js');

// Route for admin to issue a library card
router.post('/issue', isAdmin, issueLibraryCard);

// Route for admin to edit a library card
router.put('/edit/:cardId', isAdmin, editLibraryCard);

// Route for admin to delete a library card
router.delete('/delete/:cardId', isAdmin, deleteLibraryCard);

// Route for students to request a library card
router.post('/request', requestLibraryCard);

// Route to get a library card by user ID
router.get('/:userId', getLibraryCard);

module.exports = router;
