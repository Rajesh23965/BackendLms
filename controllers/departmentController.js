const DepartementModel =require("../models/departmentModel.js");
const User = require("../models/userModel.js");

const createDepartment = async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isExists = await DepartementModel.findOne({ name });
    if (isExists) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const newDepartment = new DepartementModel({ name });
    await newDepartment.save();

    // Return full department object
    res.status(200).json({
      message: "Department Created Successfully",
      department: newDepartment,
    });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ message: "Error creating department", error: error.message || error });
  }
};

const getDepartment = async (req, res) => {
  try {
    const { role, department: userDepartment } = req.user;

    if (!role) {
      return res.status(403).json({ message: "Role information missing" });
    }

    let departments;

    if (role === "admin") {
      departments = await DepartementModel.find();
    } else if (role === "student") {
      if (!userDepartment) {
        return res.status(400).json({ message: "User department is not specified" });
      }
      departments = await DepartementModel.find({ _id: userDepartment });
    } else {
      return res.status(403).json({ message: "Access denied. Invalid role" });
    }

    if (!departments || departments.length === 0) {
      return res.status(404).json({ message: "No departments found" });
    }

    res.status(200).json({ departments, message: "Departments retrieved successfully" });
  } catch (error) {
    // console.error("Error fetching departments:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message || error,
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { dept } = req.params;
    const { name } = req.body;

    const updatedDept = await DepartementModel.findByIdAndUpdate(
      dept,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedDept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({
      message: 'Department updated successfully',
      department: updatedDept,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Error updating department', error: error.message || error });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { dept } = req.params;

    const deletedDept = await DepartementModel.findByIdAndDelete(dept);

    if (!deletedDept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({ message: 'Department deleted successfully', id: dept });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department', error });
  }
};

module.exports = { createDepartment, getDepartment, updateDepartment, deleteDepartment };
