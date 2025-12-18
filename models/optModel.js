import mongoose from "mongoose";

const otpModel = mongoose.Schema({
    contact: {
        type: String,
        required: true,
        trim: true
    },
    contactType: {
        type: String,
        enum: ['email', 'phone'],
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // Auto-delete expired documents
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Limit verification attempts
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Create compound index for faster queries
otpModel.index({ contact: 1, contactType: 1 });

// Add method to check if OTP is expired
otpModel.methods.isExpired = function() {
    return new Date() > this.expiresAt;
};

// Add method to increment attempt count
otpModel.methods.incrementAttempts = function() {
    this.attempts += 1;
    return this.save();
};

const OTP = mongoose.model("OTP", otpModel);

export default OTP