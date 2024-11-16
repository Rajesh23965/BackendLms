const express = require('express');
const router = express.Router();
const { 
    createBatch, 
    getBatch,
    updateBatch,
    deleteBatch

} = require('../controllers/batchController.js');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware.js');

// Route for admin to create a book
router.post('/createbatch', isAuthenticated,isAdmin, createBatch);
router.get('/getall', getBatch)
router.put('/update/:id',isAuthenticated,isAdmin, updateBatch)
router.delete('/delete/:id',isAuthenticated,isAdmin,deleteBatch)

module.exports = router;
