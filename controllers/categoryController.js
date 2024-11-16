const Category = require('../models/categoryModel.js');

const createCategory = async (req, res) => {
  try {
    const { name, description, bookCount } = req.body;

    const newCategory = new Category({
      name,
      description,
      bookCount
    });

    await newCategory.save();

    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Admin: Update an existing category
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, bookCount } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, description, bookCount },
      { new: true } 
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

// All users: Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ getAllCategories: categories });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories
};
