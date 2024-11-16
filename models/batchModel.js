const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const batchSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  startingYear: {
    type: Number,
    required: true,
  },
  endingYear: {
    type: Number,
    required: true,
  },
});

const BatchModel = mongoose.model("Batch", batchSchema);
module.exports = BatchModel;
