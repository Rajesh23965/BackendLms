const Fine = require('../models/fineModel');
const Borrow = require('../models/borrowBookModel'); // Assuming you have a Borrow model

// Admin: Create a new fine
const createFine = async (req, res) => {
  try {
    const { user_id, borrow_id, amount } = req.body;

    // Ensure that the referenced borrow exists
    const borrowRecord = await Borrow.findById(borrow_id);
    if (!borrowRecord) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    const newFine = new Fine({
      user_id,
      borrow_id,
      amount
    });

    await newFine.save();
    res.status(201).json({ message: 'Fine created successfully', fine: newFine });
  } catch (error) {
    res.status(500).json({ message: 'Error creating fine', error });
  }
};

// Admin: Update a fine (e.g., mark as paid)
const updateFine = async (req, res) => {
  try {
    const { fineId } = req.params;
    const { amount, paid } = req.body;

    const fine = await Fine.findByIdAndUpdate(
      fineId,
      { amount, paid },
      { new: true }
    );

    if (!fine) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    res.status(200).json({ message: 'Fine updated successfully', fine });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fine', error });
  }
};

// Admin: Delete a fine
const deleteFine = async (req, res) => {
  try {
    const { fineId } = req.params;

    const fine = await Fine.findByIdAndDelete(fineId);
    if (!fine) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    res.status(200).json({ message: 'Fine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fine', error });
  }
};

// User: Get all fines for the logged-in user
const getUserFines = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming `req.user` contains the authenticated user's data

    const fines = await Fine.find({ user_id: userId }).populate('borrow_id');

    if (!fines || fines.length === 0) {
      return res.status(404).json({ message: 'No fines found for this user' });
    }

    res.status(200).json(fines);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fines', error });
  }
};

module.exports = {
  createFine,
  updateFine,
  deleteFine,
  getUserFines
};
