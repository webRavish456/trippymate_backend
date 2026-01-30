import { addAdmin } from "../controller/admin/adminController.js";
import Admin from "../models/AdminModel.js";
import User from "../models/UserModel.js";
import Role from "../models/RoleModel.js";
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
      console.log("Super Admin created successfully.");
    } else {
      // Sync roleId if Super Admin exists but has no role (e.g. created before roles existed)
      const superAdminRole = await Role.findOne({ name: "Super Admin" });
      if (superAdminRole && !adminExist.roleId) {
        await Admin.findByIdAndUpdate(adminExist._id, { roleId: superAdminRole._id });
        const user = await User.findOne({ email: "superadmin@gmail.com" });
        if (user) {
          await User.findByIdAndUpdate(user._id, { roleId: superAdminRole._id });
        }
        console.log("Super Admin role synced.");
      } else {
        console.log("Super Admin already exists.");
      }
    }
  } catch (error) {
    console.error("Error creating super admin", error);
  }
}; 
