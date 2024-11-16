const express = require("express");
const router = express.Router();
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} = require("../controllers/categoryController.js");
const {
  isAuthenticated,
  isAdmin,
} = require("../middlewares/authMiddleware.js");

router.post("/create", isAuthenticated, isAdmin, createCategory);

router.put("/update/:categoryId", isAuthenticated, isAdmin, updateCategory);

router.delete("/delete/:categoryId", isAuthenticated, isAdmin, deleteCategory);

router.get("/all", getAllCategories);

module.exports = router;
