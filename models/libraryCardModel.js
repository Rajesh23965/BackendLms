const mongoose =require('mongoose');
const Schema=mongoose.Schema;

const LibraryCardSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardNumber: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, required: true } // e.g., 'active', 'expired', 'suspended'
  });
  
  const LibraryCard = mongoose.model('LibraryCard', LibraryCardSchema);
  module.exports = LibraryCard;
  