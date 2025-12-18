import mongoose from "mongoose";

const CommunityMessageSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommunityTrip',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userImage: String,
    message: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['question', 'answer', 'general', 'announcement'],
        default: 'general'
    },
    // For Q&A: if this is an answer, link to the question
    parentMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommunityMessage',
        default: null
    },
    // Admin reply flag
    isAdminReply: {
        type: Boolean,
        default: false
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    // Read status
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Indexes
CommunityMessageSchema.index({ tripId: 1, createdAt: -1 });
CommunityMessageSchema.index({ parentMessageId: 1 });

const CommunityMessage = mongoose.model("CommunityMessage", CommunityMessageSchema);

export default CommunityMessage;

