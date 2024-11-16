const DepartementModel =require("../models/departmentModel.js");

const createDepartment=async(req,res)=>{
    const {name}=req.body;
    try {
        if(!name){
            return res.status(400).json({message:"All fields are required"});
        }

        const isExists=await DepartementModel.findOne({name});
        if(isExists){
            return res.status(400).json({message:"Department already exists"});
        }

        const newDepartment=new DepartementModel({
            name,
        });
        await newDepartment.save();
        res.status(200).json({message:"Department Created Successfully",
            department:{
                name:newDepartment.name
            }
        })
    } catch (error) {
        console.error("Error creating batch:", error); 
      res.status(500).json({ message: "Error creating batch", error: error.message || error });
    }
}

const getDepartment = async (req, res) => {
    try {
      const getAllDepartmet = await DepartementModel.find();
      if (!getAllDepartmet) {
        return res.status(404).json({ message: "Department not found" });
      } else {
        return res.status(200).json({ getAllDepartmet, message: "Departments found successfully" });  
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
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
  
  
  // Admin: Delete a book
  const deleteDepartment = async (req, res) => {
    try {
      const { dept } = req.params;
      
      const deletedDept = await DepartementModel.findByIdAndDelete(dept);
  
      if (!deletedDept) {
        return res.status(404).json({ message: 'Department not found' });
      }
  
      res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting department', error });
    }
  };


module.exports={
    createDepartment,getDepartment,updateDepartment,deleteDepartment
}