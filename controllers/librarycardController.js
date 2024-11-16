const LibraryCard = require('../models/libraryCardModel.js');
const User = require('../models/userModel.js');

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

// Admin: Issue a library card to a student
const issueLibraryCard = async (req, res) => {
  try {
    const { userId, cardNumber, issueDate, expiryDate, status } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure only students can get a card
    if (user.role !== 'student') {
      return res.status(400).json({ message: 'Library cards can only be issued to students' });
    }

    const newCard = new LibraryCard({
      user_id: userId,
      cardNumber,
      issueDate,
      expiryDate,
      status
    });

    await newCard.save();

    res.status(201).json({ message: 'Library card issued successfully', card: newCard });
  } catch (error) {
    res.status(500).json({ message: 'Error issuing library card', error });
  }
};

// Admin: Edit a library card
const editLibraryCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { cardNumber, issueDate, expiryDate, status } = req.body;

    const updatedCard = await LibraryCard.findByIdAndUpdate(
      cardId,
      { cardNumber, issueDate, expiryDate, status },
      { new: true } // Return the updated document
    );

    if (!updatedCard) {
      return res.status(404).json({ message: 'Library card not found' });
    }

    res.status(200).json({ message: 'Library card updated successfully', card: updatedCard });
  } catch (error) {
    res.status(500).json({ message: 'Error updating library card', error });
  }
};

// Admin: Delete a library card
const deleteLibraryCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const deletedCard = await LibraryCard.findByIdAndDelete(cardId);

    if (!deletedCard) {
      return res.status(404).json({ message: 'Library card not found' });
    }

    res.status(200).json({ message: 'Library card deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting library card', error });
  }
};

// Student: Request a library card (admin approval required)
const requestLibraryCard = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ message: 'Only students can request a library card' });
    }

    res.status(200).json({ message: 'Library card request submitted, pending admin approval' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting library card', error });
  }
};

// Get student library card by user ID
const getLibraryCard = async (req, res) => {
  try {
    const { userId } = req.params;

    const card = await LibraryCard.findOne({ user_id: userId });

    if (!card) {
      return res.status(404).json({ message: 'Library card not found' });
    }

    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving library card', error });
  }
};

module.exports = {
  isAdmin,
  issueLibraryCard,
  editLibraryCard,
  deleteLibraryCard,
  requestLibraryCard,
  getLibraryCard
};
