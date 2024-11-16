const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  userId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'student'], 
    default: 'student' 
  },
  batch:{
    type:mongoose.Schema.ObjectId,
    ref:'Batch'
  },
  department:{
    type:mongoose.Schema.ObjectId,
    ref:'Department'
  }
  
},{timestamps:true});

const User = mongoose.model('User', UserSchema);
module.exports = User;
