import Admin from "../../../models/AdminModel.js";
import Role from "../../../models/RoleModel.js";
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
    const adminDetails=await Admin.findOne({email:email}).populate('roleId');
     //const hashPassword=await bcrypt.hash(password,saltRounds);
     //console.log(hashPassword);
    if(!adminDetails){
        return res.status(401).json({status:"false",message:"Admin Details are not found in our record with this email"})
    }
    if (adminDetails.status && adminDetails.status !== "Active") {
        return res.status(403).json({ status: "false", message: "Your account is inactive. Please contact support." })
    }

    
     const result=await bcrypt.compare(password,adminDetails.password)
     if(!result){
        return res.status(401).json({status:"false",message:"Password did not match try again"})
    }
    else{
        // Get role details if roleId exists
        let roleId = null;
        let roleName = 'admin';
        let permissions = [];

        // Always resolve role from roleId (for correct roleName)
        let role = null;
        if (adminDetails.roleId) {
            role = await Role.findById(adminDetails.roleId);
            if (role) {
                roleId = role._id.toString();
                roleName = role.name;
            }
        }

        // Prefer permissions stored on admin, otherwise fall back to role.permissions
        if (Array.isArray(adminDetails.permissions) && adminDetails.permissions.length > 0) {
            permissions = adminDetails.permissions;
        } else if (role && role.permissions) {
            // Convert permissions Map to array format
            permissions = Array.from(role.permissions.entries()).map(([key, value]) => ({
                module: key,
                create: value.create || false,
                read: value.read || false,
                update: value.update || false,
                delete: value.delete || false
            }));
        }

        // Ensure Super Admin always has roles_permissions so they can access Roles & Permissions page
        if (roleName && roleName.toLowerCase().trim() === 'super admin') {
            const hasRolesPerm = permissions.some(p => p.module === 'roles_permissions');
            if (!hasRolesPerm) {
                permissions = permissions.concat([{
                    module: 'roles_permissions',
                    create: true,
                    read: true,
                    update: true,
                    delete: true
                }]);
            }
        }

        const token=jwt.sign({
            id: adminDetails._id,
            _id: adminDetails._id,
            email: adminDetails.email,
            name: adminDetails.name,
            role: roleName,
            roleId: roleId
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
        return res.status(200).json({
            status:"true",
            message:"Admin logged in successfully",
            Token:token,
            data: {
                admin: {
                    _id: adminDetails._id,
                    name: adminDetails.name,
                    email: adminDetails.email,
                    roleId: roleId,
                    roleName: roleName,
                    permissions: permissions
                }
            }
        });
    }


}
export { adminRegistration, adminLogin };