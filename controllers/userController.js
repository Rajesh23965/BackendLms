const User = require('../models/userModel.js');
const BatchModel=require('../models/batchModel.js')
const DepartementModel=require('../models/departmentModel.js')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create a new user (Admin or Student)

const createUser = async (req, res) => {
  try {
    const { userId, name, email, password, mobileNumber, role, batch, department } = req.body;

    // Validate inputs
    if (!name || !email || !password || !mobileNumber || !role || !batch || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    // Validate batch and department exist
    const batchExists = await BatchModel.findById(batch);
    const departmentExists = await DepartementModel.findById(department);

    if (!batchExists || !departmentExists) {
      return res.status(400).json({ message: 'Invalid batch or department reference' });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
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

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create a JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Set the token in a cookie (cookie will expire after 1 hour)
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // maxAge is in milliseconds

    res.status(200).json({ success: true, message: 'Login successful',user,token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout
const Logout = (req, res) => {
  try {
    res.clearCookie('token');
  res.status(200).json({success: true, message: 'User Logout successfully' });
  } catch (error) {
    // If there's an error, return a 500 status code with a message
    res.status(500).json({ success: false, message: "Internal server error" });
    console.log(error); // Log the error for debugging purposes
}
}

// Check the Authenticated User's information
const CheckUser = (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    console.log(error);
  }
  
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
    const users = await User.find()
      .populate('batch')       
      .populate('department');   
    
    res.status(200).json(users);  
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error });
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


module.exports = {
  createUser,
  login,
  Logout,
  CheckUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
};

