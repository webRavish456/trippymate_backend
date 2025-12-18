import mongoose from "mongoose";

const CaptainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String // This will be used for both address and location display
  },
  experience: {
    type: Number // Years of experience
  },
  price: {
    type: Number, // Price per day in INR
    default: 999
  },
  badge: {
    type: String, // e.g., "Local Expert", "Trek Expert", "Culture Expert"
    default: "Local Expert"
  },
  badgeColor: {
    type: String, // e.g., "yellow", "green", "orange"
    enum: ['yellow', 'green', 'orange', 'blue', 'red'],
    default: 'yellow'
  },
  backgroundImage: {
    type: String // URL for background image
  },
  specialization: {
    type: [String], // e.g., ["Adventure", "Cultural", "Wildlife"]
    default: []
  },
  category: {
    type: [String], // e.g., ["Solo Traveler", "Family", "Couple", "Group", "Business"]
    default: []
  },
  languages: {
    type: [String], // e.g., ["English", "Hindi", "Spanish"]
    default: []
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  photos: {
    type: [String],
    default: []
  },
  profileImage: {
    type: String // Single profile image URL
  },
  backgroundImage: {
    type: String // Background image URL (uploaded, not URL input)
  },
  documents: {
    type: [String],
    default: []
  },
  bio: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave'],
    default: 'active'
  },
  bankDetails: {
    accountHolderName: {
      type: String
    },
    accountNumber: {
      type: String
    },
    ifscCode: {
      type: String
    },
    bankName: {
      type: String
    },
    branchName: {
      type: String
    },
    accountType: {
      type: String,
      enum: ['savings', 'current'],
      default: 'savings'
    },
    upiId: {
      type: String
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

const Captain = mongoose.model("Captain", CaptainSchema);

export default Captain;

