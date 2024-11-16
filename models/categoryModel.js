const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CategorySchema = new Schema({
    name: { type: String, required: true , unique: true,},
    bookCount: {
      type: Number,
      default: 0,
    },
    description: { type: String, required:false },
    createdAt: { type: Date, default: Date.now }
  });
  
  const Category = mongoose.model('Category', CategorySchema);
  module.exports = Category;
  