const mongoose = require('mongoose');

const LibraryCardSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Ensures one card per user
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    cardNumber: {
      type: String,
      default: null,
      unique: true, 
    },
    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending',
    },
    issueDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LibraryCard', LibraryCardSchema);
