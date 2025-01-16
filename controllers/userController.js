const User = require('../models/userModel.js');
const BatchModel=require('../models/batchModel.js')
const DepartementModel=require('../models/departmentModel.js');;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose'); 
const { messages } = require('nodemailer-mock/lib/messages');

// Create a new user (Admin or Student)

const createUser = async (req, res) => {
  try {
    const { userId, name, email, password, mobileNumber, role, batch, department } = req.body;

    // Validate inputs
    if (!name || !email || !password || !mobileNumber || !role || !batch || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Password validation
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, include an uppercase letter and a number.' });
    }

    // Validate role
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    // Validate batch and department exist
    const batchExists = await BatchModel.findById(batch);
    const departmentExists = await DepartementModel.findById(department);
    
    if (!batchExists && !departmentExists) {
      return res.status(400).json({ message: 'Invalid batch or department reference' });
    }

    // Check for duplicate email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      userId,
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      role,
      batch,
      department
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: { name: newUser.name, email: newUser.email, mobileNumber: newUser.mobileNumber, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create a JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    // Set the token in a cookie
    // res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  
      maxAge: 3600000,
    });
    
    
  
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: user,
      token: token,
    });
    

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



const verifyAndRefreshToken = (req, res, next) => {
  const token = req.cookies.token || 
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                 ? req.headers.authorization.split(' ')[1] 
                 : null);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expired. Please log in again.' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < 300) { // Refresh token if close to expiry
      const newToken = jwt.sign(
        { _id: decoded._id, role: decoded.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000,
      });
    }

    req.user = decoded;
    next();
  });
};




const Logout = (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Send a success response
    res.status(200).json({ success: true, message: 'User logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



// Check the Authenticated User's information
const CheckUser = (req, res) => {
  // Access the decoded user data from req.user
  const user = req.user;

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Return user information
  res.status(200).json({
    success: true,
    message: "User profile retrieved successfully",
    user,
  });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies.token;

  console.log("Token received:", token); 

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Error:", err.message);
      return res.status(403).json({ message: "Invalid or expired token ", error: err.message });
    }
    req.user = user; // Attach user to the request
    next();
  });
};


// Get a specific user by ID (for admins)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let studentData;

    if (role === "admin") {
      studentData = await User.find()
        .populate('batch')
        .populate('department');
      return res.status(200).json({ studentData, message: "All users found successfully" });
    }

    if (role === "student") {
      studentData = await User.findById(_id).populate('batch').populate('department');
      if (!studentData) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({ studentData, message: "User data found successfully" });
    }

    return res.status(403).json({ message: "Unauthorized access" });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
};



//update
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, mobileNumber, role, batch, department } = req.body;

    // Validate batch and department exist
    if (batch) {
      const batchExists = await BatchModel.findById(batch);
      if (!batchExists) {
        return res.status(400).json({ message: 'Invalid batch reference' });
      }
    }
    
    if (department) {
      const departmentExists = await DepartementModel.findById(department);
      if (!departmentExists) {
        return res.status(400).json({ message: 'Invalid department reference' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, mobileNumber, role, batch, department },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};


// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};

//Search
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchConditions = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { mobileNumber: { $regex: query, $options: 'i' } },
        { userId: { $regex: query, $options: 'i' } },
        ...(mongoose.Types.ObjectId.isValid(query)
          ? [
              { batch: query },
              { department: query },
            ]
          : []),
      ],
    };

    const users = await User.find(searchConditions)
      .populate('batch', 'batchName')
      .populate('department', 'departmentName');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found matching the query' });
    }

    res.status(200).json({ users, message: 'Users found successfully' });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

module.exports = { searchUsers };


const changePassword = async (req, res) => {
  const { password, newPassword, confirmNewPassword } = req.body;


  const { _id } = req.user;

  // Input validation
  if (!password || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match' });
  }

  try {
    // Fetch the user by ID
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the old password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Hash the new password and save
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password has been changed successfully' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


//Forgot Password
// Forget Password
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email input
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = Date.now() + 3600000; // OTP valid for 1 hour

    // Update user with OTP and expiry
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "rajeshky123456@gmail.com", // Your email
        pass: "vjfc yigc mpch jujq", // Your email password or app password
      },
    });

    const mailOptions = {
      from: "rajeshky123456@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It will expire in 1 hour.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Error in forgetPassword:", error);
    res.status(500).json({ message: "An error occurred. Please try again later." });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmNewPassword } = req.body;

  try {
    // Validate inputs
    if (!email || !otp || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New password and confirm password do not match." });
    }

    // Check password strength
   

    // Find user and validate OTP
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure OTP is still valid
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Hash the new password and update
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined; // Clear OTP
    user.resetPasswordExpires = undefined; // Clear OTP expiry
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error in resetPassword:", error.message); // Avoid logging sensitive data
    res.status(500).json({ message: "An error occurred. Please try again later." });
  }
};




module.exports = {
  createUser,
  searchUsers,
  login,
  Logout,
  CheckUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  verifyAndRefreshToken,
  forgetPassword,
  resetPassword,
  changePassword,
  authenticateToken

};





