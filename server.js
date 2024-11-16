// app.js
const express = require('express');
const mongoose = require('mongoose');
const cookieparser =require('cookie-parser');
const cors=require('cors');
const DBCon =require('./utils/db.js')
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes =require('./routes/categoryRoutes');
const libraryCardRoutes =require("./routes/librarycardRoutes")
const fineRoutes = require('./routes/fineRoutes');
const batchRoutes =require('./routes/batchRoutes.js');
const departmentRoutes=require("./routes/departmentRoutes.js")

require('dotenv').config();

const PORT=process.env.PORT || 8000
const app = express();
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
DBCon()
// Middleware
app.use(express.json());
app.use(cookieparser())
// CORS options
const corsOptions = {
  origin: "http://localhost:5173", // React frontend's URL
  credentials: true, // Allow credentials like cookies, authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  optionsSuccessStatus: 200, // For legacy browser support
};

// Use the CORS middleware
app.use(cors(corsOptions));


// Routes
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/category',categoryRoutes);
app.use("/api/card",libraryCardRoutes);
app.use('/fines', fineRoutes);
app.use("/api/batch",batchRoutes);
app.use("/api/department",departmentRoutes);
app.listen(PORT,()=>{
  console.log(`Server is running on ${PORT}`);
})
