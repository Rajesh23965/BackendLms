const express = require("express");
const router = express.Router();
const borrowController = require("../controllers/borrowController.js");
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware.js');

// Borrow a book
router.post("/borrow", borrowController.borrowBook);
router.get("/count",  borrowController.countIssuedBooks);

// Return a book
router.post("/return", borrowController.returnBook);

// Get all borrowed books
router.get("/getAll",isAuthenticated,borrowController.getAllBorrowedBooks);
// Get all returned books
router.get("/getReturn",borrowController.getAllReturnedBooks);

router.post("/payFine", borrowController.payFine);

router.get("/search", isAuthenticated,isAdmin, borrowController.searchBorrowedBooks);
router.post('/notification', isAuthenticated,borrowController.sendDueNotification);
// Add this route in your routes file
router.get('/borrowedBooksCount/:userId', borrowController.getUserBorrowedBooksCount);

module.exports = router;
