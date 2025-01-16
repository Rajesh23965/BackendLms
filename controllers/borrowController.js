const Borrow = require("../models/borrowBookModel.js");
const Book = require("../models/bookModel.js");
const User = require("../models/userModel.js");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const schedule = require("node-schedule");


// Function to schedule fine updates
const scheduleFine = (borrowId, dueDate) => {
  const fineStartDate = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000); 
  schedule.scheduleJob(fineStartDate, async function applyFine() {
    try {
      const borrow = await Borrow.findById(borrowId);
      if (!borrow || borrow.status !== "Borrowed") {
        console.log("Borrow record not found or already returned.");
        return;
      }

      const now = new Date();
      const overdueDays = Math.floor((now - borrow.dueDate) / (2 * 24 * 60 * 60 * 1000)); 
      const newFine = overdueDays * 10;

      if (newFine > borrow.fine) {
        borrow.fine = newFine;
        await borrow.save();
        console.log(`Fine updated for borrow ID ${borrowId}: ${newFine}`);
      }

      // Reschedule the fine update for 2 days later
      const nextFineUpdate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      schedule.scheduleJob(nextFineUpdate, applyFine);
    } catch (error) {
      console.error(`Error updating fine for borrow ID ${borrowId}:`, error);
    }
  });
};

// Updated borrowBook function
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
      fine: 0, // Start with no fine
    });

    await borrow.save();
    book.status = "Issued";
    await book.save();

    // Schedule a notification one day before the due date
    sendDueNotifications(user.email, borrow._id, dueDateObj);

    // Schedule to apply fine after due date
    scheduleFine(borrow._id, dueDateObj);

    res.status(201).json({ message: "Book borrowed successfully.", borrow });
  } catch (error) {
    console.error("Borrow Book Error:", error);
    res.status(500).json({ message: "Server error", error: error.stack || error.message });
  }
};



const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rajeshky123456@gmail.com',
    pass: "vjfc yigc mpch jujq", 
  }
});

// Route to manually send notifications for all overdue books of a user
exports.sendDueNotification = async (req, res) => {
  try {
    const { userId } = req.body;

    // Fetch all borrowed books for the user
    const borrows = await Borrow.find({ user: userId, status: "Borrowed" })
      .populate("user")
      .populate("book");

    if (!borrows || borrows.length === 0) {
      return res.status(400).json({ message: "No borrowed books found for the user." });
    }

    const user = borrows[0].user; // All borrows belong to the same user

    // Generate the table rows for all borrowed books
    const bookDetails = borrows
      .map(
        (borrow) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${borrow.book.title}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${borrow.dueDate.toLocaleDateString()}</td>
        </tr>
      `
      )
      .join("");

    // Send a single email with all borrowed books
    const mailOptions = {
      from: "rajeshky123456@gmail.com",
      to: user.email,
      subject: "Library Book Due Soon",
      html: `
        <p>Dear ${user.name},</p>
        
        <p>This is a reminder that you have borrowed the following books from the library:</p>
        
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Book Title</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${bookDetails}
          </tbody>
        </table>
        
        <p>Please return the books on time to avoid any fines.</p>
        
        <p>Best regards,</p>
        <p>Your Library</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Mark notifications as sent for all borrowed books
    await Promise.all(
      borrows.map(async (borrow) => {
        borrow.notificationSent = true;
        await borrow.save();
      })
    );

    res.status(200).json({ message: "Notification sent successfully for all borrowed books." });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      message: "Error sending notification",
      error: error.message,
    });
  }
};



exports.getAllBorrowedBooks = async (req, res) => {
  try {
    // Validate req.user existence
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized access. User information is missing." });
    }

    const { role, id: loggedInUserId } = req.user; // Extract role and ID from req.user
    const { userId, name, title, author, isbn } = req.query;

    // Ensure the user has a role
    if (!role) {
      return res.status(403).json({ message: "User role is required to fetch borrowed books." });
    }

    // Define base filter for borrowed books
    let filter = { status: "Borrowed" };

    // Role-Based Access Control
    if (role === "student") {
      // Students can only fetch their own borrowed books
      filter.user = loggedInUserId; // Ensure they can only see their records
    } else if (role === "admin") {
      // Admins and Librarians can fetch all borrowed books
      if (userId) {
        filter.user = userId; // Optionally filter by user ID
      }
    } else {
      return res.status(403).json({ message: "Unauthorized to view borrowed books." });
    }

    // Optional filters for user name
    if (name) {
      const users = await User.find({ name: { $regex: name, $options: "i" } });
      const userIds = users.map((user) => user._id);
      filter.user = { $in: userIds };
    }

    // Optional filters for books
    let bookFilter = {};
    if (title) bookFilter.title = { $regex: title, $options: "i" };
    if (author) bookFilter.author = { $regex: author, $options: "i" };
    if (isbn) bookFilter.ISBN = isbn;

    // If book filters are provided, find matching books and update the filter
    if (Object.keys(bookFilter).length > 0) {
      const books = await Book.find(bookFilter);
      const bookIds = books.map((book) => book._id);
      filter.book = { $in: bookIds };
    }

    // Fetch borrowed records and populate user and book details
    const borrows = await Borrow.find(filter)
      .populate("user", "name email")
      .populate("book", "title author ISBN");

    // If no records are found
    if (!borrows.length) {
      return res.status(200).json({ message: "No borrowed books found." });
    }

    // Return borrowed books
    res.status(200).json({ borrows });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching borrowed books.", error: error.message });
  }
};



exports.returnBook = async (req, res) => {
  try {
    const { borrowId } = req.body;

    // Find borrow record and populate the associated book
    const borrow = await Borrow.findById(borrowId).populate("book");
    if (!borrow || borrow.status !== "Borrowed") {
      return res.status(400).json({
        message: "Borrow record not found or already returned.",
      });
    }

    const currentDate = new Date();
    let fine = 0;

    // Check if the book is overdue
    if (borrow.dueDate && currentDate > borrow.dueDate) {
      const overdueMinutes = Math.ceil(
        (currentDate - borrow.dueDate) / (1000 * 60) 
      );
      fine = overdueMinutes * 10; 
    }
    

    // Update borrow record status and fine
    borrow.status = "Returned";
    borrow.returnedDate = currentDate;
    borrow.fine = fine;
    await borrow.save();

    // Update book status to Available
    borrow.book.status = "Available";
    await borrow.book.save();

    res.status(200).json({
      message: "Book returned successfully.",
      fine: fine > 0 ? `₹${fine}` : "No fine",
      borrow,
    });
  } catch (error) {
    console.error("Error in returnBook:", error);
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

// Route

// Controller
exports.payFine = async (req, res) => {
  const { borrowId } = req.body;

  try {
    // Validate borrowId format
    if (!mongoose.Types.ObjectId.isValid(borrowId)) {
      return res.status(400).json({ message: "Invalid borrowId format." });
    }

    // Find the borrow record
    const borrow = await Borrow.findById(borrowId);

    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found." });
    }

    // Ensure the borrow status is valid for fine payment
    if (borrow.status !== "Borrowed") {
      return res.status(400).json({ message: "Cannot pay fine for a returned or invalid borrow record." });
    }

    // Check if there is a fine to pay
    if (borrow.fine === 0) {
      return res.status(400).json({ message: "No fine to pay for this record." });
    }

    // Update fine status, reset fine amount, and update isPaid flag
    borrow.fineStatus = "Paid";
    borrow.fine = 0;
    borrow.isPaid = true;
    await borrow.save();

    res.status(200).json({
      message: "Fine paid successfully. Status updated.",
      borrow,
    });
  } catch (error) {
    console.error("Error processing fine payment:", error);
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



exports.countIssuedBooks = async (req, res) => {
  try {
  
    const issuedBooksCount = await Borrow.countDocuments({ status: "Borrowed" });

    res.status(200).json({
      count: issuedBooksCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving count of issued books.",
      error: error.stack || error.message,
    });
  }
};

// Get the count of borrowed books for a specific user
exports.getUserBorrowedBooksCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const borrowedBooksCount = await Borrow.countDocuments({
      user: userId,
      status: "Borrowed",
    });

    res.status(200).json({
      count: borrowedBooksCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving borrowed books count.",
      error: error.stack || error.message,
    });
  }
};





// Function to send notifications
const sendDueNotifications = async () => {
  try {
    // Get the current date and calculate the target date (one day before due date)
    const today = new Date();
    const targetDate = new Date(today.setDate(today.getDate() + 1));

    // Find all borrow records with a due date matching the target date
    const borrows = await Borrow.find({
      dueDate: { $gte: targetDate.setHours(0, 0, 0, 0), $lte: targetDate.setHours(23, 59, 59, 999) },
      status: "Borrowed",
    }).populate("user").populate("book");

    if (borrows.length === 0) {
      console.log("No notifications to send today.");
      return;
    }

    // Group borrow records by user
    const userBorrowMap = {};
    borrows.forEach((borrow) => {
      if (!userBorrowMap[borrow.user._id]) {
        userBorrowMap[borrow.user._id] = {
          user: borrow.user,
          books: [],
        };
      }
      userBorrowMap[borrow.user._id].books.push(borrow);
    });

    // Send an email to each user
    for (const userId in userBorrowMap) {
      const { user, books } = userBorrowMap[userId];

      const bookDetails = books
        .map(
          (borrow) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${borrow.book.title}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${borrow.dueDate.toLocaleDateString()}</td>
          </tr>
        `
        )
        .join("");

      const mailOptions = {
        from: "rajeshky123456@gmail.com",
        to: user.email,
        subject: "Library Book Due Soon",
        html: `
          <p>Dear ${user.name},</p>
          
          <p>This is a reminder that you have borrowed the following books from the library, which are due tomorrow:</p>
          
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Book Title</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              ${bookDetails}
            </tbody>
          </table>
          
          <p>Please return the books on time to avoid any fines.</p>
          
          <p>Best regards,</p>
          <p>Your Library</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Notification sent to ${user.email}`);
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

// Schedule the task to run daily at 8:00 AM
schedule.scheduleJob("0 8 * * *", async () => {
  console.log("Running daily notification job...");
  await sendDueNotifications();
});
