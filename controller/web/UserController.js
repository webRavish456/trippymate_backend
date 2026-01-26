import Customer from "../../models/CustomerModel.js";

const AddUser=async(req,res)=>{
    console.log("Request Reached Here");
    //await mongoose.connection.db.collection("User").dropIndex(Vendor ID_1)
    const data=req.body;
    try{
    const userDetail=await Customer.create(data)
    return res.status(201).json({status:"true",message:"User created successfully",data:userDetail})
    }
    catch(err){
        return res.status(500).json({status:"false",message:"error occured" ,error:err.message})
    }
}

export { AddUser }