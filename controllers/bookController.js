const Book = require('../models/bookModel.js');
// Improved createBook function (file uploads optional)
const createBook = async (req, res) => {
  try {
  

    const { title, author, isbn, category, status, publisher, description, edition } = req.body;
    const files = req.files || [];
    if (!req.body.title || !req.body.author || !req.body.isbn ) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const userId = req.user._id;

    const fileDetails = files.map(file => ({
      filename: file.originalname,
      filePath: `uploads/${file.filename}`,
      fileType: file.mimetype,
    }));
    

    const newBook = new Book({
      title,
      author,
      isbn,
      category,
      status,
      publisher,
      description,
      edition,
      files: fileDetails,
      userId,
    });

    await newBook.save();
    res.status(201).json({ message: 'Book created successfully', book: newBook });
  } catch (error) {
    console.error('Error creating book:', error); // Log the error
    res.status(500).json({ message: 'Error creating book', error: error.message });
  }
};


const updateBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const updatedFields = { ...req.body }; 

    // Get the userId from the authenticated user
    const userId = req.user ? req.user._id : null;
    if (!userId) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }

    const updatedBook = await Book.findByIdAndUpdate(bookId, updatedFields, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Book updated successfully', book: updatedBook });
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error });
  }
};



const deleteBook = async (req, res) => {
  const userId = req.user ? req.user._id : null;
  try {
    const { bookId } = req.params;

    const deletedBook = await Book.findByIdAndDelete(bookId);
    if (!userId) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }

    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error });
  }
};

// All users: Get all books
// const getAllBooks = async (req, res) => {
//   const userId = req.user ? req.user._id : null;
//   try {
//     if (!userId) {
//       return res.status(401).json({ message: 'User is not authenticated' });
//     }
//     const books = await Book.find();
//     res.status(200).json(books);
//   } catch (error) {
//     res.status(500).json({ message: 'Error retrieving books', error });
//   }
// };
const getAllBooks = async (req, res) => {
  const userId = req.user ? req.user._id : null;
  try {
    if (!userId) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }

    const { isbn, title, author, edition, publisher, category, status } = req.query;

 
    const filter = {};
    if (isbn) filter.isbn = new RegExp(isbn, 'i'); 
    if (title) filter.title = new RegExp(title, 'i');
    if (author) filter.author = new RegExp(author, 'i');
    if (edition) filter.edition = new RegExp(edition, 'i');
    if (publisher) filter.publisher = new RegExp(publisher, 'i');
    if (category) filter.category = new RegExp(category, 'i');
    if (status) filter.status = status; 
    const books = await Book.find(filter);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving books', error });
  }
};


// All users: Get book by ID
const getBookById = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving book', error });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Create a case-insensitive regex for the search query
    const regex = new RegExp(query, "i");

    // Search across multiple fields
    const results = await Book.find({
      $or: [
        { title: { $regex: regex } },
        { author: { $regex: regex } },
        { publisher: { $regex: regex } },
        { isbn: { $regex: regex } },
      ],
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No users found matching the search query" });
    }

    res.status(200).json({ filterData: results });
  } catch (error) {
    res.status(500).json({ message: "Error performing search", error });
  }
};




module.exports = {
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
  getAllBooks,
  getBookById
};
