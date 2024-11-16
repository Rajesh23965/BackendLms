const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  publisher: { type: String },
  description: {
    type: String,
  },
  edition: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    // required: true,
  },
  files: [
    {
      filename: { type: String },
      filePath: { type: String},
      fileType: { type: String },
    },
  ],
  status: {
    type: String,
    enum: ["Available", "Reserved", "Issued", "Lost"],
    default: "Available",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const Book = mongoose.model("Book", BookSchema);
module.exports = Book;





