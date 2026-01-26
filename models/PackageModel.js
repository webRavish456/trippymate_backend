import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: String, // e.g., "5 Days 4 Nights"
  },
  source: {
    type: String,
  },
  destination: {
    type: String,
  },
  destinations: [{
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExploreDestination",
    },
    destinationName: String,
    destinationType: String, // "popular", "season", "category", "region", "adventure", "culture"
    budget: {
      accommodation: Number,
      food: Number,
      activities: Number,
      transport: Number,
      miscellaneous: Number,
      total: Number,
      currency: { type: String, default: "INR" }
    },
    places: [String], // Place names where users can visit ("yeha yeha ghum sakte hai")
  }],
  highlights: [String], // Array of highlight strings
  overview: {
    type: String, // Detailed description
  },
  category: {
    type: String,
    enum: ["adventure", "family", "honeymoon", "holiday", "cultural", "religious", "wildlife", "beach", "hill-station", "weekend", "other"],
    default: "other"
  },
  state: {
    type: String, // For state-wise packages: "jammu-kashmir", "goa", "kerala", etc.
    default: ""
  },
  region: {
    type: String, // "north", "south", "east", "west"
    enum: ["north", "south", "east", "west", ""],
    default: ""
  },
  packageType: {
    type: String, // e.g., "Honeymoon Packages", "Adventure Packages", "Family Packages"
    default: ""
  },
  features: [{
    type: String // e.g., "Romantic", "Adventure", "Family-friendly", "Luxury"
  }],
  customization: {
    carRentals: {
      available: { type: Boolean, default: false },
      options: [{
        carType: String, // e.g., "Sedan", "SUV", "Luxury"
        pricePerDay: Number,
        description: String
      }]
    },
    guides: {
      available: { type: Boolean, default: false },
      options: [{
        guideType: String, // e.g., "Local Guide", "Expert Guide", "Multi-lingual Guide"
        price: Number,
        description: String
      }]
    },
    extendedStays: {
      available: { type: Boolean, default: false },
      pricePerDay: Number,
      description: String
    },
    mealPlans: {
      available: { type: Boolean, default: false },
      options: [{
        planType: String, // e.g., "Breakfast Only", "Half Board", "Full Board"
        price: Number,
        description: String
      }]
    }
  },
  itinerary: [
    {
      day: Number,
      title: String,
      description: String,
      activities: [String],
      meals: String, // e.g., "Breakfast, Dinner"
      accommodation: String,
    }
  ],
  inclusions: [String],
  exclusions: [String],
  price: {
    adult: { type: Number, required: true },
    child: { type: Number, default: 0 },
    infant: { type: Number, default: 0 },
    currency: { type: String, default: "INR" }
  },
  discount: {
    percentage: { type: Number, default: 0 },
    validFrom: Date,
    validUntil: Date
  },
  images: [String], // Cloudinary URLs
  documents: [String], // Document paths
  otherDetails: {
    type: String,
  },
  status: {
    type: String,
    enum: ["draft", "active", "inactive"],
    default: "active"
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true 
});

const Packages = mongoose.model("Packages", PackageSchema);
export default Packages