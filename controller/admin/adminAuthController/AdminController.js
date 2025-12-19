import Admin from "../../../models/AdminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const saltRounds = 15;
const secretKey = process.env.JWT_SECRET || 'secret'; // In production, use environment variables to store secret keys

// Admin Registration   
const adminRegistration=async(req,res)=>{
    const {email,name,password}=req.body;
    
    if(!email || ! password || !name){
        return res.status(401).json({status:"false",message:"Both email and password are require"})
    }
    try{
    const hashPassword=await bcrypt.hash(password,saltRounds);
    const admin=await new Admin({
        name,email,
        password:hashPassword
    })
    const result =admin.save();
    if(result){
        return res.status(200).json({status:"true",message:"Admin Registration successful"})
    }
}
catch(err){

        return res.status(401).json({status:"false",message:"Admin Registration failed",Error:err.msg})
        
}
    
}
const adminLogin=async(req,res)=>{
    const {email,password}=req.body;

    if(!email || ! password){
        return res.status(401).json({status:"false",message:"Both email and password are require"})
    }
    const adminDetails=await Admin.findOne({email:email});
     //const hashPassword=await bcrypt.hash(password,saltRounds);
     //console.log(hashPassword);
    if(!adminDetails){
        return res.status(401).json({status:"false",message:"Admin Details are not found in our record with this email"})
    }

    
     const result=await bcrypt.compare(password,adminDetails.password)
     if(!result){
        return res.status(401).json({status:"false",message:"Password did not match try again"})
    }
    else{
        const token=jwt.sign({
            id: adminDetails._id,
            _id: adminDetails._id,
            email: adminDetails.email,
            name: adminDetails.name,
            role: 'admin'
        },
            secretKey,
            {expiresIn:"28d"}
            
        )
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"Strict",
            maxAge:3600000

        })
        return res.status(200).json({status:"true",message:"Admin logged in successfully",Token:token});
    }


}
export { adminRegistration, adminLogin };