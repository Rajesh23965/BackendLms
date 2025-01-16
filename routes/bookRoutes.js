const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createBook,
  updateBook,
  deleteBook,
  getAllBooks,
  getBookById,
  searchBooks,
  countBooks
} = require("../controllers/bookController.js");
const {
  isAuthenticated,
  isAdmin,
} = require("../middlewares/authMiddleware.js");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "text/plain",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  },

  limits: { fileSize: 30 * 1024 * 1024 }, 
});


router.post(
  "/create",
  isAuthenticated,
  isAdmin,
  (req, res, next) => {
    upload.array("files")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: "File upload error", error: err.message });
      } else if (err) {
        return res
          .status(400)
          .json({ message: "Invalid file type", error: err.message });
      }
      next();
    });
  },
  createBook
);
router.get('/search',isAuthenticated, isAdmin,   searchBooks);
router.get('/count',isAuthenticated, isAdmin,  countBooks);
// Route for admin to update a book
router.put("/update/:bookId", isAuthenticated, isAdmin, updateBook);

// Route for admin to delete a book
router.delete("/delete/:bookId", isAuthenticated, isAdmin, deleteBook);

// Route for all authenticated users to get all books
router.get("/all",isAuthenticated,isAdmin,  getAllBooks);

router.get("/:bookId",isAuthenticated, isAdmin,  getBookById);

module.exports = router;
