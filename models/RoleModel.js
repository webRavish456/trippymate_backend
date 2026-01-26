import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema({
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false }
}, { _id: false });

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  roleKey: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: Boolean,
    default: true
  },
  permissions: {
    type: Map,
    of: PermissionSchema,
    default: new Map()
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Role = mongoose.model("Role", RoleSchema);

export default Role;
