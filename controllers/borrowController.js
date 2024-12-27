const Borrow = require("../models/borrowBookModel.js");
const Book = require("../models/bookModel.js");
const User = require("../models/userModel.js");
const mongoose = require("mongoose");

// Borrow a Book
exports.borrowBook = async (req, res) => {
  try {
    const { userId, bookId, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid bookId format." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const borrowedBooksCount = await Borrow.countDocuments({
      user: userId,
      status: "Borrowed",
    });
    if (borrowedBooksCount >= 3) {
      return res.status(400).json({
        message: "You have already borrowed the maximum number of books (3).",
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    if (book.status !== "Available") {
      return res
        .status(400)
        .json({ message: "Book is not available for borrowing." });
    }

    const issuedDate = new Date();
    const dueDateObj = dueDate
      ? new Date(dueDate)
      : new Date(issuedDate.getTime() + 10 * 24 * 60 * 60 * 1000);

    if (isNaN(dueDateObj)) {
      return res.status(400).json({ message: "Invalid due date format." });
    }

    const borrow = new Borrow({
      user: user._id,
      book: bookId,
      ISBN: book.ISBN,
      userEmail: user.email,
      dueDate: dueDateObj,
      status: "Borrowed",
    });

    await borrow.save();
    book.status = "Issued";
    await book.save();

    res.status(201).json({ message: "Book borrowed successfully.", borrow });
  } catch (error) {
    console.error("Borrow Book Error:", error);
    res.status(500).json({ message: "Server error", error: error.stack || error.message });
  }
};

// Return a Book
exports.returnBook = async (req, res) => {
  try {
    const { borrowId } = req.body;

    const borrow = await Borrow.findById(borrowId).populate("book");
    if (!borrow || borrow.status !== "Borrowed") {
      return res.status(400).json({
        message: "Borrow record not found or already returned.",
      });
    }

    const currentDate = new Date();
    let fine = 0;
    if (borrow.dueDate && currentDate > borrow.dueDate) {
      const overdueDays = Math.ceil(
        (currentDate - borrow.dueDate) / (1000 * 60 * 60 * 24)
      );
      fine = overdueDays * 10;
    }

    borrow.status = "Returned";
    borrow.returnedDate = currentDate;
    borrow.fine = fine;
    await borrow.save();

    borrow.book.status = "Available";
    await borrow.book.save();

    res.status(200).json({ message: "Book returned successfully.", borrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get All Borrowed Books
exports.getAllBorrowedBooks = async (req, res) => {
  try {
    const { userId, name, title, author, isbn } = req.query;

    let filter = { status: "Borrowed" };

    if (userId) {
      filter.user = userId;
    }

    if (name) {
      const users = await User.find({ name: { $regex: name, $options: "i" } });
      const userIds = users.map((user) => user._id);
      filter.user = { $in: userIds };
    }

    let bookFilter = {};
    if (title) bookFilter.title = { $regex: title, $options: "i" };
    if (author) bookFilter.author = { $regex: author, $options: "i" };
    if (isbn) bookFilter.ISBN = isbn;

    if (Object.keys(bookFilter).length > 0) {
      const books = await Book.find(bookFilter);
      const bookIds = books.map((book) => book._id);
      filter.book = { $in: bookIds };
    }

    const borrows = await Borrow.find(filter).populate("user book");

    if (borrows.length === 0) {
      return res.status(200).json({ message: "No borrowed books found." });
    }

    res.status(200).json({ borrows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



exports.getAllReturnedBooks = async (req, res) => {
  try {
    // Find all borrow records where status is "Returned"
    const borrows = await Borrow.find({ status: "Returned" })
      .sort({ returnedDate: -1 })
      .limit(10)
      .populate("user book");

    res.status(200).json({ borrows });

    // Automatically delete older returned records
    await Borrow.deleteMany({
      status: "Returned",
      _id: { $nin: borrows.map((b) => b._id) },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.payFine = async (req, res) => {
  const { borrowId } = req.body;

  try {
    // Find the borrow record
    const borrow = await Borrow.findById(borrowId);

    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found." });
    }

    // Check if there is a fine to pay
    if (borrow.fine === 0) {
      return res.status(400).json({ message: "No fine to pay for this record." });
    }

    // Update fine status, reset fine amount, and update isPaid flag
    borrow.fineStatus = "Paid";
    borrow.fine = 0;
    borrow.isPaid = true; // Set isPaid to true since fine is paid
    await borrow.save();

    res.status(200).json({
      message: "Fine paid successfully. Status updated.",
      borrow,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error processing fine payment.",
      error: error.stack || error.message,
    });
  }
};

  
// Search Borrowed Books by ISBN, User Name, or User Email
exports.searchBorrowedBooks = async (req, res) => {
  try {
    const { isbn, name, email } = req.query;

    let filter = { status: "Borrowed" };

    // Search by ISBN
    if (isbn) {
      filter["book.ISBN"] = isbn;
    }

    // Search by user name
    if (name) {
      const users = await User.find({
        name: { $regex: name, $options: "i" }, // Case-insensitive search
      });
      const userIds = users.map((user) => user._id);
      filter.user = { $in: userIds };
    }

    // Search by user email
    if (email) {
      const users = await User.find({
        email: { $regex: email, $options: "i" },
      });
      const userIds = users.map((user) => user._id);
      filter.user = { $in: userIds };
    }

    // Perform the query
    const borrows = await Borrow.find(filter)
      .populate("user book");

    if (borrows.length === 0) {
      return res.status(200).json({ message: "No records found." });
    }

    res.status(200).json({ borrows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
