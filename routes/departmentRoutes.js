const express = require("express");
const router = express.Router();

const {
  createDepartment,
  getDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController.js");
const {
  isAdmin,
  isAuthenticated,
} = require("../middlewares/authMiddleware.js");

router.post("/createdepartment", isAuthenticated,isAdmin,  createDepartment);

router.get("/all", getDepartment);

router.put("/updatedept/:dept",  isAuthenticated,isAdmin, updateDepartment);

router.delete("/delete/:dept",  isAuthenticated,isAdmin, deleteDepartment);
module.exports = router;
