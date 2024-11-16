const mongoose =require("mongoose");
const Schema=mongoose.Schema
const departementSchema = new Schema({
    name : {
        type : String,
        required : true,
        unique : true
    },
});


const DepartementModel = mongoose.model("Department", departementSchema);
module.exports = DepartementModel;
