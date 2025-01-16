const express = require('express');
const {
  requestLibraryCard,
  approveLibraryCard,
  getLibraryCard,
  getPendingLibraryCards
} = require('../controllers/librarycardController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes
router.post('/request', isAuthenticated, requestLibraryCard);
router.put('/approve/:cardId', isAuthenticated, isAdmin, approveLibraryCard);
router.get('/:userId?', isAuthenticated, getLibraryCard);
router.get("/pending", isAuthenticated,getPendingLibraryCards);

module.exports = router;



// const express = require('express');
// const {
//   requestLibraryCard,
//   issueLibraryCard,
//   editLibraryCard,
//   deleteLibraryCard,
//   getLibraryCard,
// } = require('../controllers/librarycardController.js');
// const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// const router = express.Router();

// // Routes
// router.post('/request', isAuthenticated, requestLibraryCard);
// router.put('/issue/:cardId', isAuthenticated, isAdmin, issueLibraryCard);
// router.put('/edit/:cardId', isAuthenticated, isAdmin, editLibraryCard);
// router.delete('/delete/:cardId', isAuthenticated, isAdmin, deleteLibraryCard);
// router.get('/:userId', isAuthenticated, getLibraryCard);

// module.exports = router;



