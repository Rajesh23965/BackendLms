const LibraryCard = require('../models/libraryCardModel.js');
const User = require('../models/userModel.js');
const Joi = require('joi');

// Card number generator
const generateCardNumber = (name = '') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let cardNumber = (name.slice(0, 3).toUpperCase() || 'USR');
  for (let i = 0; i < 7; i++) {
    cardNumber += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return cardNumber;
};


exports.requestLibraryCard = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
      batch: Joi.string().required(),
      department: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { user_id, batch, department } = value;

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingCard = await LibraryCard.findOne({ user_id });
    if (existingCard) return res.status(400).json({ message: 'Library card already requested or issued' });

    // Generate a card number
    const cardNumber = generateCardNumber(user.name);

    const libraryCard = await LibraryCard.create({
      user_id,
      batch,
      department,
      cardNumber,  // Ensure cardNumber is assigned at the time of creation
    });

    // After creating the library card, fetch all library cards and return them
    const libraryCards = await LibraryCard.find()
      .populate('user_id', 'name email')
      .populate('batch', 'name')
      .populate('department', 'name');

    res.status(201).json({
      message: 'Library card request submitted successfully',
      libraryCard,
      allLibraryCards: libraryCards,  // Return all library cards
    });
  } catch (error) {
    next(error);
  }
};

// Approve a library card
// Approve a library card
exports.approveLibraryCard = async (req, res, next) => {
  try {
    const { cardId } = req.params;

    const libraryCard = await LibraryCard.findById(cardId)
      .populate('user_id', 'name email')  // Populate user data (name and email)
      .populate('batch', 'name')          // Populate batch data if needed
      .populate('department', 'name');    // Populate department data if needed

    if (!libraryCard) return res.status(404).json({ message: 'Library card not found' });

    if (libraryCard.status === 'approved') {
      return res.status(400).json({ message: 'Library card is already approved' });
    }

    const cardNumber = generateCardNumber(libraryCard.user_id.name);

    libraryCard.cardNumber = cardNumber;
    libraryCard.issueDate = new Date();
    libraryCard.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    libraryCard.status = 'approved';

    await libraryCard.save();
    res.status(200).json({
      message: 'Library card approved and issued successfully',
      libraryCard,
    });
  } catch (error) {
    next(error);
  }
};


// Get library card details
exports.getLibraryCard = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, id: loggedInUserId } = req.user;

    if (role === 'student' && userId && userId !== loggedInUserId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = role === 'admin' ? (userId ? { user_id: userId } : {}) : { user_id: loggedInUserId };

    const libraryCards = await LibraryCard.find(query)
      .populate('user_id', 'name email')
      .populate('batch', 'name')
      .populate('department', 'name');

    if (!libraryCards.length) return res.status(404).json({ message: 'Library card(s) not found' });

    res.status(200).json(libraryCards);
  } catch (error) {
    next(error);
  }
};


exports.getPendingLibraryCards = async (req, res, next) => {
  try {
    const libraryCards = await LibraryCard.find({ status: "pending" })
      .populate("user_id", "name email")
      .populate("batch", "name")
      .populate("department", "name");

    res.status(200).json({ libraryCards });
  } catch (error) {
    next(error);
  }
};
