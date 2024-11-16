const mongoose =require('mongoose');
const Schema=mongoose.Schema;
const BorrowSchema = new Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    ISBN: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    isBorrowed: {
      type: Boolean,
      default: true,
    },
    /* DATES */
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    returnedDate: {
      type: Date,
    },

    fine: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    status: { type: String, required: true }, 
    notificationSent: { type: Boolean, default: false }
  });
  
  const Borrow = mongoose.model('Borrow', BorrowSchema);
  module.exports = Borrow;
  

//   const BorrowSchema = new Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
//     ISBN: { type: String, required: true },
//     userEmail: { type: String, required: true },
//     isBorrowed: { type: Boolean, default: true },
//     borrowDate: { type: Date, default: Date.now },
//     dueDate: { type: Date },
//     returnedDate: { type: Date },
//     fine: { type: Number, default: 0 },
//     isPaid: { type: Boolean, default: false },
//     status: { type: String, required: true },
//     notificationSent: { type: Boolean, default: false }
// });