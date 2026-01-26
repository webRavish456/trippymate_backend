
import { addAdmin } from "../controller/admin/adminController.js";
import Admin from  "../models/AdminModel.js";
import { seed } from "./seed.js";
import { seedRoles } from "./createRoles.js";


export const createAdmin = async () => {
       try {
              // First seed roles
              await seedRoles();
              
              const adminExist = await Admin.findOne({ email: "superadmin@gmail.com" });
              
              if (!adminExist) {

                     for (const admin of seed.admins) {
                            await addAdmin(admin); 
                     } 
                     console.log('Super Admin created successfully.');
                 }
               else {
                     console.log('Super Admin already exists.');
              }
       } catch (error) {
              console.error('Error creating super admin', error);
       }
}; 
