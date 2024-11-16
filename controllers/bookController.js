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
const getAllBooks = async (req, res) => {
  const userId = req.user ? req.user._id : null;
  try {
    if (!userId) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }
    const books = await Book.find();
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

module.exports = {
  createBook,
  updateBook,
  deleteBook,
  getAllBooks,
  getBookById
};
