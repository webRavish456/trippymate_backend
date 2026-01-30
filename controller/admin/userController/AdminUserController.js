import bcrypt from "bcrypt";
import Admin from "../../../models/AdminModel.js";
import User from "../../../models/UserModel.js";
import Role from "../../../models/RoleModel.js";

const saltRounds = 15;

// Create Admin User
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, roleId, phone } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Name, email, password, and confirm password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Password and confirm password do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid email address"
      });
    }

    // Check if user already exists in UserModel
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User with this email already exists"
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return res.status(400).json({
        status: false,
        message: "Admin with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get role and permissions if roleId is provided
    let role = null;
    let permissionsArray = [];
    
    if (roleId) {
      role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          status: false,
          message: "Role not found"
        });
      }
      
      // Copy permissions from role
      if (role.permissions) {
        permissionsArray = Array.from(role.permissions.entries()).map(([key, value]) => ({
          module: key,
          create: value.create || false,
          read: value.read || false,
          update: value.update || false,
          delete: value.delete || false,
        }));
      }
    }

    // Create User in UserModel (users module)
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      roleId: roleId || null,
      status: "Active"
    };

    if (phone) {
      userData.phone = phone;
    }

    let user;
    try {
      user = await User.create(userData);
    } catch (err) {
      // Handle Mongo duplicate key errors (e.g., email already exists)
      if (err && (err.code === 11000 || err.code === 11001)) {
        const dupField = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(400).json({
          status: false,
          message: `${dupField} already exists`,
        });
      }
      throw err;
    }

    // Also save in AdminModel with role name
    const adminData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      roleId: roleId || null,
      status: "Active",
      permissions: permissionsArray
    };

    let admin;
    try {
      admin = await Admin.create(adminData);
    } catch (err) {
      // If admin create fails after user create, rollback user to avoid dangling record
      if (err && (err.code === 11000 || err.code === 11001)) {
        await User.findByIdAndDelete(user._id);
        const dupField = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(400).json({
          status: false,
          message: `${dupField} already exists`,
        });
      }
      // rollback on other errors too
      await User.findByIdAndDelete(user._id);
      throw err;
    }


    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      roleName: role ? role.name : null,
      status: user.status,
      createdAt: user.createdAt
    };

    const adminResponse = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      roleId: admin.roleId,
      permissions: admin.permissions || [],
      createdAt: admin.createdAt
    };

    return res.status(201).json({
      status: true,
      message: "User created successfully",
      data: {
        user: userResponse,
        admin: adminResponse
      }
    });
  } catch (error) {
    console.error("Create admin user error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to create admin user",
      error: error.message
    });
  }
};

// Update Admin User
export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, confirmPassword, roleId, phone, status } = req.body;

    // Find user in UserModel
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Find corresponding admin
    const admin = await Admin.findOne({ email: user.email });
    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found"
      });
    }

    // Update name if provided
    if (name) {
      user.name = name.trim();
      admin.name = name.trim();
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(400).json({
          status: false,
          message: "Email already exists"
        });
      }
      user.email = email.toLowerCase().trim();
      admin.email = email.toLowerCase().trim();
    }

    // Update phone if provided
    if (phone !== undefined) {
      user.phone = phone;
    }

    // Update status if provided
    if (status) {
      user.status = status;
      admin.status = status;
    }

    // Update password if provided
    if (password) {
      if (!confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Confirm password is required"
        });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Password and confirm password do not match"
        });
      }
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      user.password = hashedPassword;
      admin.password = hashedPassword;
    }

    // Update role and permissions if roleId is provided
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          status: false,
          message: "Role not found"
        });
      }
      user.roleId = roleId;
      admin.roleId = roleId;
      if (role.permissions) {
        admin.permissions = Array.from(role.permissions.entries()).map(([key, value]) => ({
          module: key,
          create: value.create || false,
          read: value.read || false,
          update: value.update || false,
          delete: value.delete || false,
        }));
      }
    }

    try {
      await user.save();
      await admin.save();
    } catch (err) {
      if (err && (err.code === 11000 || err.code === 11001)) {
        const dupField = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(400).json({
          status: false,
          message: `${dupField} already exists`,
        });
      }
      throw err;
    }

    // Get role name
    const role = user.roleId ? await Role.findById(user.roleId) : null;

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      roleName: role ? role.name : null,
      status: user.status,
      updatedAt: user.updatedAt
    };

    const adminResponse = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      roleId: admin.roleId,
      permissions: admin.permissions || [],
      updatedAt: admin.updatedAt
    };

    return res.status(200).json({
      status: true,
      message: "User updated successfully",
      data: {
        user: userResponse,
        admin: adminResponse
      }
    });
  } catch (error) {
    console.error("Update admin user error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to update admin user",
      error: error.message
    });
  }
};

// Get all Admin Users
export const getAdminUsers = async (req, res) => {
  try {
    // Get users from UserModel (users module)
    const users = await User.find().populate('roleId').sort({ createdAt: -1 });

    const usersWithRole = await Promise.all(users.map(async (user) => {
      let roleId = user.roleId?._id || user.roleId || null;
      let roleName = user.roleId?.name || null;

      // If User has no role but Admin record exists with roleId, sync from Admin
      if (!roleId || !roleName) {
        const admin = await Admin.findOne({ email: user.email }).select('roleId').populate('roleId', 'name');
        if (admin?.roleId) {
          roleId = admin.roleId._id;
          roleName = admin.roleId.name;
          // Sync User.roleId so next time we don't need fallback
          if (!user.roleId) {
            await User.findByIdAndUpdate(user._id, { roleId: admin.roleId._id });
          }
        }
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roleId,
        roleName,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }));

    return res.status(200).json({
      status: true,
      message: "Users fetched successfully",
      data: usersWithRole
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user in UserModel
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Check if Super Admin
    const role = user.roleId ? await Role.findById(user.roleId) : null;
    if (role && (role.name.toLowerCase() === "super admin" || role.name.toLowerCase() === "admin")) {
      return res.status(400).json({
        status: false,
        message: "Cannot delete Super Admin user"
      });
    }

    // Find and delete corresponding admin
    const admin = await Admin.findOne({ email: user.email });
    if (admin) {
      await Admin.findByIdAndDelete(admin._id);
    }

    // Delete user
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};
