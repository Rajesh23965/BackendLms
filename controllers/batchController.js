const BatchModel = require("../models/batchModel.js");

const createBatch = async (req, res) => {
  try {
    const { name, startingYear, endingYear } = req.body;

    // Validate inputs
    if (!name || !startingYear || !endingYear) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if batch already exists
    const isExists = await BatchModel.findOne({ name });
    if (isExists) {
      return res.status(400).json({ message: "Batch already exists" });
    }

    const batchData = {
      name,
      startingYear: new Date(startingYear).getTime(),
      endingYear: new Date(endingYear).getTime(),
    };
    
    const newBatch = new BatchModel(batchData);
    await newBatch.save();

    res.status(201).json({
      message: "Batch created successfully",
      batch: {
        name: newBatch.name,
        startingYear: newBatch.startingYear,
        endingYear: newBatch.endingYear,
      },
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({ message: "Error creating batch", error: error.message || error });
  }
};

  //Get Batch data


  const getBatch = async (req, res) => {
    try {
      const getAllBatch = await BatchModel.find();
      if (!getAllBatch) {
        return res.status(404).json({ message: "Batch not found" });
      } else {
        return res.status(200).json({ getAllBatch, message: "Batch found successfully" });  
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const updateBatch = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, startingYear, endingYear } = req.body;
  
      // Validate input
      if (!name || !startingYear || !endingYear) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Find batch by ID and update
      const updateBatchData = await BatchModel.findByIdAndUpdate(
        id,
        {
          name,
          startingYear: new Date(startingYear).getTime(),
          endingYear: new Date(endingYear).getTime(),
        },
        { new: true, runValidators: true }
      );
  
      // If batch not found
      if (!updateBatchData) {
        return res.status(404).json({ message: 'Batch not found' });
      }
  
      // Success response
      res.status(200).json({
        message: 'Batch updated successfully',
        batch: updateBatchData,
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      res.status(500).json({ message: 'Error updating batch', error: error.message || error });
    }
  };
  
  //To delete Batch
  const deleteBatch = async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleteBatch = await BatchModel.findByIdAndDelete(id);
  
      if (!deleteBatch) {
        return res.status(404).json({ message: 'Batch not found' });
      }
  
      res.status(200).json({ message: 'Batch deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting batch', error });
    }
  };

module.exports = {
    createBatch,
    getBatch,
    updateBatch,
    deleteBatch,
    
  };