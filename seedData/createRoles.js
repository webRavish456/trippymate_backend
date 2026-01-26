import Role from "../models/RoleModel.js";



const initialRoles = [
  {
    name: "Super Admin",
    status: true,
    permissions: new Map([

   
      ["captain_details", { create: true, read: true, update: true, delete: true }],
      ["users", { create: true, read: true, update: true, delete: true }],
      ["explore_destination", { create: true, read: true, update: true, delete: true }],
      ["community_trips", { create: true, read: true, update: true, delete: true }],
      ["packages", { create: true, read: true, update: true, delete: true }],
      ["banner", { create: true, read: true, update: true, delete: true }],
      ["coupon_details", { create: true, read: true, update: true, delete: true }],
      ["promo_details", { create: true, read: true, update: true, delete: true }],
      

      ["blog_posts", { create: true, read: true, update: true, delete: true }],
      ["articles", { create: true, read: true, update: true, delete: true }],
      ["testimonials", { create: true, read: true, update: true, delete: true }],
      ["faq", { create: true, read: true, update: true, delete: true }],
      
 
      ["captain_assignment", { create: false, read: true, update: false, delete: false }],
      ["customers", { create: false, read: true, update: false, delete: false }],
      ["vendors", { create: true, read: true, update: true, delete: true }],
      ["bookings", { create: false, read: true, update: false, delete: false }],
      ["trips", { create: false, read: true, update: false, delete: false }],
      ["payments", { create: false, read: true, update: false, delete: false }],
      ["coupon_management", { create: false, read: true, update: false, delete: false }],
      ["promo_management", { create: false, read: true, update: false, delete: false }],
      ["notifications", { create: false, read: true, update: false, delete: false }],
      
      // Report modules (sirf READ)
      ["income", { create: false, read: true, update: false, delete: false }],
      ["expense", { create: false, read: true, update: false, delete: false }],
      ["trip_report", { create: false, read: true, update: false, delete: false }],
      ["vendor_report", { create: false, read: true, update: false, delete: false }],
      ["captains_report", { create: false, read: true, update: false, delete: false }],
      
      // Settings (no DELETE)
      ["settings", { create: true, read: true, update: true, delete: false }],
    ])
  },
  {
    name: "Admin",
    status: true,
    permissions: new Map([
      // Full CRUD modules (except roles_permissions)
      ["captain_details", { create: true, read: true, update: true, delete: true }],
      ["users", { create: true, read: true, update: true, delete: true }],
      ["explore_destination", { create: true, read: true, update: true, delete: true }],
      ["community_trips", { create: true, read: true, update: true, delete: true }],
      ["packages", { create: true, read: true, update: true, delete: true }],
      ["banner", { create: true, read: true, update: true, delete: true }],
      ["coupon_details", { create: true, read: true, update: true, delete: true }],
      ["promo_details", { create: true, read: true, update: true, delete: true }],
      
      // Content modules (CRUD)
      ["blog_posts", { create: true, read: true, update: true, delete: true }],
      ["articles", { create: true, read: true, update: true, delete: true }],
      ["testimonials", { create: true, read: true, update: true, delete: true }],
      ["faq", { create: true, read: true, update: true, delete: true }],
      
      // Read-only modules (sirf READ)
      ["captain_assignment", { create: false, read: true, update: false, delete: false }],
      ["customers", { create: false, read: true, update: false, delete: false }],
      ["vendors", { create: true, read: true, update: true, delete: true }],
      ["bookings", { create: false, read: true, update: false, delete: false }],
      ["trips", { create: false, read: true, update: false, delete: false }],
      ["payments", { create: false, read: true, update: false, delete: false }],
      ["coupon_management", { create: false, read: true, update: false, delete: false }],
      ["promo_management", { create: false, read: true, update: false, delete: false }],
      ["notifications", { create: false, read: true, update: false, delete: false }],
      
      // Report modules (sirf READ)
      ["income", { create: false, read: true, update: false, delete: false }],
      ["expense", { create: false, read: true, update: false, delete: false }],
      ["trip_report", { create: false, read: true, update: false, delete: false }],
      ["vendor_report", { create: false, read: true, update: false, delete: false }],
      ["captains_report", { create: false, read: true, update: false, delete: false }],
      
      // Settings (no DELETE)
      ["settings", { create: true, read: true, update: true, delete: false }],
      
      // Roles and Permissions - NO ACCESS for Admin (explicitly set to false)
      ["roles_permissions", { create: false, read: false, update: false, delete: false }],
    ])
  },
  {
    name: "Vendor",
    status: true,
    permissions: new Map([
      ["packages", { create: true, read: true, update: true, delete: false }],
      ["bookings", { create: false, read: true, update: false, delete: false }], // Read-only
      ["payments", { create: false, read: true, update: false, delete: false }], // Read-only
      ["vendor_report", { create: false, read: true, update: false, delete: false }], // Read-only
    ])
  },
  {
    name: "Captain",
    status: true,
    permissions: new Map([
      ["trips", { create: false, read: true, update: false, delete: false }], // Read-only
      ["bookings", { create: false, read: true, update: false, delete: false }], // Read-only
      ["community_trips", { create: true, read: true, update: true, delete: false }],
      ["captains_report", { create: false, read: true, update: false, delete: false }], // Read-only
    ])
  },
  {
    name: "Managing Director",
    status: true,
    permissions: new Map([
      ["users", { create: false, read: true, update: true, delete: false }],
      ["customers", { create: false, read: true, update: false, delete: false }], // Read-only
      ["vendors", { create: false, read: true, update: false, delete: false }], // Read-only
      ["captain_details", { create: false, read: true, update: true, delete: false }],
      ["captain_assignment", { create: false, read: true, update: false, delete: false }], // Read-only
      ["packages", { create: false, read: true, update: true, delete: false }],
      ["bookings", { create: false, read: true, update: false, delete: false }], // Read-only
      ["trips", { create: false, read: true, update: false, delete: false }], // Read-only
      ["payments", { create: false, read: true, update: false, delete: false }], // Read-only
      ["income", { create: false, read: true, update: false, delete: false }], // Read-only
      ["expense", { create: false, read: true, update: false, delete: false }], // Read-only
      ["trip_report", { create: false, read: true, update: false, delete: false }], // Read-only
      ["vendor_report", { create: false, read: true, update: false, delete: false }], // Read-only
      ["captains_report", { create: false, read: true, update: false, delete: false }], // Read-only
    ])
  },
  {
    name: "CEO",
    status: true,
    permissions: new Map([
      ["users", { create: false, read: true, update: false, delete: false }],
      ["customers", { create: false, read: true, update: false, delete: false }], // Read-only
      ["vendors", { create: false, read: true, update: false, delete: false }], // Read-only
      ["captain_details", { create: false, read: true, update: false, delete: false }],
      ["captain_assignment", { create: false, read: true, update: false, delete: false }], // Read-only
      ["packages", { create: false, read: true, update: false, delete: false }],
      ["bookings", { create: false, read: true, update: false, delete: false }], // Read-only
      ["trips", { create: false, read: true, update: false, delete: false }], // Read-only
      ["payments", { create: false, read: true, update: false, delete: false }], // Read-only
      ["income", { create: false, read: true, update: false, delete: false }], // Read-only
      ["expense", { create: false, read: true, update: false, delete: false }], // Read-only
      ["trip_report", { create: false, read: true, update: false, delete: false }], // Read-only
      ["vendor_report", { create: false, read: true, update: false, delete: false }], // Read-only
      ["captains_report", { create: false, read: true, update: false, delete: false }], // Read-only
      ["settings", { create: false, read: true, update: true, delete: false }], // No DELETE
    ])
  }
];

export const seedRoles = async () => {
  try {
    console.log("Starting to seed roles...");

    for (const roleData of initialRoles) {
      // Generate roleKey from name
      const roleKey = roleData.name.toLowerCase().replaceAll(' ', '_');
      
      // Check if role already exists (including deleted)
      const existingRole = await Role.findOne({ 
        $or: [
          { name: roleData.name },
          { roleKey: roleKey }
        ]
      });
      
      if (!existingRole) {
        const role = new Role({
          ...roleData,
          roleKey: roleKey,
          isDeleted: false
        });
        await role.save();
        console.log(`✓ Created role: ${roleData.name}`);
      } else if (existingRole.isDeleted) {
        // Restore deleted role
        existingRole.name = roleData.name;
        existingRole.roleKey = roleKey;
        existingRole.status = roleData.status;
        existingRole.permissions = roleData.permissions;
        existingRole.isDeleted = false;
        await existingRole.save();
        console.log(`✓ Restored role: ${roleData.name}`);
      } else {
        console.log(`⊘ Role already exists: ${roleData.name}`);
      }
    }

    console.log("Roles seeding completed!");
    return true;
  } catch (error) {
    console.error("Error seeding roles:", error);
    throw error;
  }
};


