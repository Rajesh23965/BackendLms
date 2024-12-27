const express = require("express");
const router = express.Router();
const borrowController = require("../controllers/borrowController.js");
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware.js');

// Borrow a book
router.post("/borrow",isAuthenticated,isAdmin, borrowController.borrowBook);

// Return a book
router.post("/return",isAuthenticated,isAdmin, borrowController.returnBook);

// Get all borrowed books
router.get("/getAll", borrowController.getAllBorrowedBooks);
// Get all returned books
router.get("/getReturn",isAuthenticated,isAdmin,borrowController.getAllReturnedBooks);

router.post("/payFine", isAuthenticated,isAdmin,borrowController.payFine)

router.get("/search", isAuthenticated,isAdmin, borrowController.searchBorrowedBooks);

module.exports = router;
