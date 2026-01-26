import Role from "../../../models/RoleModel.js";

// Get all roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isDeleted: false }).sort({ createdAt: 1 });
    
    // Convert permissions Map to array format for response
    const rolesWithPermissions = roles.map(role => {
      const permissionsArray = Array.from(role.permissions.entries()).map(([key, value]) => ({
        module: key,
        create: value.create || false,
        read: value.read || false,
        update: value.update || false,
        delete: value.delete || false
      }));

      return {
        _id: role._id,
        name: role.name,
        status: role.status,
        permissions: permissionsArray,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };
    });

    return res.status(200).json({
      status: true,
      message: "Roles fetched successfully",
      data: rolesWithPermissions
    });
  } catch (error) {
    console.error("Get roles error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch roles",
      error: error.message
    });
  }
};

// Get role by ID
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Role not found"
      });
    }

    // Convert permissions Map to array format
    const permissionsArray = Array.from(role.permissions.entries()).map(([key, value]) => ({
      module: key,
      create: value.create || false,
      read: value.read || false,
      update: value.update || false,
      delete: value.delete || false
    }));

    return res.status(200).json({
      status: true,
      message: "Role fetched successfully",
      data: {
        _id: role._id,
        name: role.name,
        status: role.status,
        permissions: permissionsArray,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }
    });
  } catch (error) {
    console.error("Get role by ID error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch role",
      error: error.message
    });
  }
};

// Create role
export const createRole = async (req, res) => {
  try {
    const { name, permissions, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: false,
        message: "Role name is required"
      });
    }

    // Generate roleKey from name (lowercase, replace spaces with underscore)
    const roleKey = name.trim().toLowerCase().replace(/\s+/g, '_');

    // Check if role with same name or roleKey already exists (including deleted)
    const existingRole = await Role.findOne({ 
      $or: [
        { name: name.trim() },
        { roleKey: roleKey }
      ]
    });

    if (existingRole) {
      // If role exists but is deleted, restore it
      if (existingRole.isDeleted) {
        existingRole.name = name.trim();
        existingRole.roleKey = roleKey;
        existingRole.status = status !== undefined ? status : true;
        existingRole.isDeleted = false;
        
        // Update permissions if provided
        if (permissions) {
          const permissionsMap = new Map();
          if (Array.isArray(permissions)) {
            permissions.forEach(perm => {
              if (perm.module) {
                permissionsMap.set(perm.module, {
                  create: perm.create || false,
                  read: perm.read || false,
                  update: perm.update || false,
                  delete: perm.delete || false
                });
              }
            });
          } else if (typeof permissions === 'object') {
            Object.keys(permissions).forEach(key => {
              permissionsMap.set(key, {
                create: permissions[key].create || false,
                read: permissions[key].read || false,
                update: permissions[key].update || false,
                delete: permissions[key].delete || false
              });
            });
          }
          existingRole.permissions = permissionsMap;
        }
        
        const restoredRole = await existingRole.save();
        
        // Convert permissions Map to array format for response
        const permissionsArray = Array.from(restoredRole.permissions.entries()).map(([key, value]) => ({
          module: key,
          create: value.create || false,
          read: value.read || false,
          update: value.update || false,
          delete: value.delete || false
        }));

        return res.status(200).json({
          status: true,
          message: "Role restored successfully",
          data: {
            _id: restoredRole._id,
            name: restoredRole.name,
            roleKey: restoredRole.roleKey,
            status: restoredRole.status,
            permissions: permissionsArray,
            createdAt: restoredRole.createdAt,
            updatedAt: restoredRole.updatedAt
          }
        });
      } else {
        // Role already exists and is active
        return res.status(400).json({
          status: false,
          message: "Role with this name already exists"
        });
      }
    }

    // Convert permissions array to Map format
    const permissionsMap = new Map();
    if (permissions && Array.isArray(permissions)) {
      permissions.forEach(perm => {
        if (perm.module) {
          permissionsMap.set(perm.module, {
            create: perm.create || false,
            read: perm.read || false,
            update: perm.update || false,
            delete: perm.delete || false
          });
        }
      });
    } else if (permissions && typeof permissions === 'object') {
      // Handle object format permissions
      Object.keys(permissions).forEach(key => {
        permissionsMap.set(key, {
          create: permissions[key].create || false,
          read: permissions[key].read || false,
          update: permissions[key].update || false,
          delete: permissions[key].delete || false
        });
      });
    }

    const newRole = new Role({
      name: name.trim(),
      roleKey: roleKey,
      status: status !== undefined ? status : true,
      permissions: permissionsMap,
      isDeleted: false
    });

    const savedRole = await newRole.save();

    // Convert permissions Map to array format for response
    const permissionsArray = Array.from(savedRole.permissions.entries()).map(([key, value]) => ({
      module: key,
      create: value.create || false,
      read: value.read || false,
      update: value.update || false,
      delete: value.delete || false
    }));

    return res.status(201).json({
      status: true,
      message: "Role created successfully",
        data: {
          _id: savedRole._id,
          name: savedRole.name,
          roleKey: savedRole.roleKey,
          status: savedRole.status,
          permissions: permissionsArray,
          createdAt: savedRole.createdAt,
          updatedAt: savedRole.updatedAt
        }
    });
  } catch (error) {
    console.error("Create role error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to create role",
      error: error.message
    });
  }
};

// Update role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, status } = req.body;

    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Role not found"
      });
    }

    // Prevent updating Super Admin name
    if (name && name.trim().toLowerCase() !== role.name.toLowerCase()) {
      const lowerName = role.name.toLowerCase();
      if (lowerName === "super admin" || lowerName === "admin") {
        return res.status(400).json({
          status: false,
          message: "Cannot change Super Admin role name"
        });
      }
    }

    // Update name if provided
    if (name && name.trim()) {
      // Check if new name already exists (excluding current role)
      const existingRole = await Role.findOne({ 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingRole) {
        return res.status(400).json({
          status: false,
          message: "Role with this name already exists"
        });
      }
      role.name = name.trim();
    }

    // Update status if provided
    if (status !== undefined) {
      role.status = status;
    }

    // Update permissions if provided
    if (permissions) {
      const permissionsMap = new Map();
      
      if (Array.isArray(permissions)) {
        permissions.forEach(perm => {
          if (perm.module) {
            permissionsMap.set(perm.module, {
              create: perm.create || false,
              read: perm.read || false,
              update: perm.update || false,
              delete: perm.delete || false
            });
          }
        });
      } else if (typeof permissions === 'object') {
        Object.keys(permissions).forEach(key => {
          permissionsMap.set(key, {
            create: permissions[key].create || false,
            read: permissions[key].read || false,
            update: permissions[key].update || false,
            delete: permissions[key].delete || false
          });
        });
      }
      
      role.permissions = permissionsMap;
    }

    const updatedRole = await role.save();

    // Convert permissions Map to array format for response
    const permissionsArray = Array.from(updatedRole.permissions.entries()).map(([key, value]) => ({
      module: key,
      create: value.create || false,
      read: value.read || false,
      update: value.update || false,
      delete: value.delete || false
    }));

    return res.status(200).json({
      status: true,
      message: "Role updated successfully",
      data: {
        _id: updatedRole._id,
        name: updatedRole.name,
        status: updatedRole.status,
        permissions: permissionsArray,
        createdAt: updatedRole.createdAt,
        updatedAt: updatedRole.updatedAt
      }
    });
  } catch (error) {
    console.error("Update role error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to update role",
      error: error.message
    });
  }
};

// Delete role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Role not found"
      });
    }

    // Prevent deletion of Super Admin
    const lowerName = role.name.toLowerCase();
    if (lowerName === "super admin" || lowerName === "admin") {
      return res.status(400).json({
        status: false,
        message: "Cannot delete Super Admin role"
      });
    }

    // Soft delete - mark as deleted instead of actually deleting
    role.isDeleted = true;
    role.status = false;
    await role.save();

    return res.status(200).json({
      status: true,
      message: "Role deleted successfully"
    });
  } catch (error) {
    console.error("Delete role error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to delete role",
      error: error.message
    });
  }
};

// Update role status
export const updateRoleStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        status: false,
        message: "Status is required"
      });
    }

    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Role not found"
      });
    }

    role.status = status;
    await role.save();

    return res.status(200).json({
      status: true,
      message: "Role status updated successfully",
      data: {
        _id: role._id,
        name: role.name,
        status: role.status
      }
    });
  } catch (error) {
    console.error("Update role status error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to update role status",
      error: error.message
    });
  }
};
