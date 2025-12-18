import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
    // Personal details
    name: {
        type: String,
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        select: false // Don't return password by default
    },
    address: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    typeOfId: {
        type: String
    },
    idNumber: {
        type: String
    },
    status: {
        type: String,
        default: 'Active'
    },
    // Google OAuth
    googleId: {
        type: String,
        sparse: true
    },
    isGoogleUser: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String
    },
    // Password Reset
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    }
}, 
{ timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

export default User;