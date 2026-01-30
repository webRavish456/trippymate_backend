import mongoose from "mongoose";

const CommunityTripSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    tripType: {
        type: String,
        enum: ['adventure', 'beach', 'cultural', 'nature', 'festival', 'relaxation', 'other'],
        default: 'other'
    },
    groupType: {
        type: String,
    },
    maxMembers: {
        type: Number,
        default: 20
    },
    
    // Images
    images: [{
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    }],
    
    // Organizer Details
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    organizerName: {
        type: String,
        required: false
    },
    organizerImage: {
        filename: String,
        path: String,
        publicId: String,
        mimetype: String,
        size: Number
    },
    organizerRating: {
        type: Number,
        default: 0
    },
    organizerVerified: {
        type: Boolean,
        default: false
    },
    
    // Members
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }],
    
    // Pricing
    price: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    
    // Status
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    
    // Approval Status (for user-created trips)
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved' // Admin-created trips are auto-approved
    },
    
    // Additional Details
    itinerary: [{
        day: Number,
        date: Date,
        activities: [String],
        description: String
    }],
    inclusions: [String],
    exclusions: [String],
    importantNotes: String,
    
    // Q&A/Messages
    messageCount: {
        type: Number,
        default: 0
    },
    
    // Community Rating (average of all user ratings)
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Indexes
CommunityTripSchema.index({ startDate: 1 });
CommunityTripSchema.index({ status: 1 });
CommunityTripSchema.index({ organizerId: 1 });

const CommunityTrip = mongoose.model("CommunityTrip", CommunityTripSchema);

export default CommunityTrip;

