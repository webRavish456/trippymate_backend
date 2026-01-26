import bcrypt from "bcrypt";
import Admin from "../../models/AdminModel.js";
import Role from "../../models/RoleModel.js";
import User from "../../models/UserModel.js";

function rolePermissionsMapToArray(permissionsMap) {
    return Array.from((permissionsMap || new Map()).entries()).map(([key, value]) => ({
        module: key,
        create: value?.create || false,
        read: value?.read || false,
        update: value?.update || false,
        delete: value?.delete || false,
    }));
}

async function resolveRoleFromAdminData(adminData) {
    if (adminData?.roleId) {
        return await Role.findById(adminData.roleId);
    }

    const roleKey = adminData?.roleKey ? String(adminData.roleKey).toLowerCase().trim() : null;
    const roleName = adminData?.roleName ? String(adminData.roleName).trim() : null;

    const byKey = roleKey ? await Role.findOne({ roleKey }) : null;
    if (byKey) return byKey;

    const byName = roleName ? await Role.findOne({ name: roleName }) : null;
    if (byName) return byName;

    if (roleKey) {
        const derivedName = roleKey
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        const byDerivedName = await Role.findOne({ name: derivedName });
        if (byDerivedName) return byDerivedName;
    }

    if (roleKey === "super_admin") {
        return await Role.findOne({ name: "Super Admin" });
    }

    return null;
}

export const addAdmin = async (adminData) => {

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Resolve role (optional) and copy permissions to Admin schema
    let roleId = null;
    let permissions = [];
    const role = await resolveRoleFromAdminData(adminData);
    if (role) {
        roleId = role._id;
        permissions = rolePermissionsMapToArray(role.permissions);
    }

    const admin = {

           email: adminData.email,
           password: hashedPassword,
           roleId,
           permissions,
    };
    const createdAdmin = await Admin.create(admin);

    // Ensure the same admin also appears in Users module (UserModel)
    // (Avoid duplicates; UserModel password will be hashed by its pre-save hook.)
    const normalizedEmail = adminData.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        // If legacy user exists without roleId, upgrade it so UI shows the correct role
        const needsRoleUpgrade = !existingUser.roleId && !!roleId;
        if (needsRoleUpgrade) {
            existingUser.roleId = roleId;
            await existingUser.save();
        }
    } else {
        await User.create({
            name: (adminData.name || "Super Admin").trim(),
            email: normalizedEmail,
            phone: adminData.phone || "",
            password: adminData.password, // plaintext; UserModel will hash
            roleId,
            status: "Active",
        });
    }

    return createdAdmin;
};