const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FineSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    borrow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrow', required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Fine = mongoose.model('Fine', FineSchema);
module.exports = Fine;
