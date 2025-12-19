import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Packages",
      required: true
    },
    captainRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    servicesRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    accommodationRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    overallExperience: {
      type: Number,
      min: 0,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    photos: [{
      filename: String,
      path: String,
      publicId: String,
      mimetype: String,
      size: Number
    }]
  },
  { timestamps: true }
);

// Indexes
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ packageId: 1 });

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;

