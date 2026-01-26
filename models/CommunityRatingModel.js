import mongoose from "mongoose";

const CommunityRatingSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityTrip",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    feedback: {
      question1: String,
      question2: String,
      question3: String,
      question4: String
    }
  },
  { timestamps: true }
);

// Ensure one rating per user per trip
CommunityRatingSchema.index({ tripId: 1, userId: 1 }, { unique: true });

const CommunityRating = mongoose.model("CommunityRating", CommunityRatingSchema);
export default CommunityRating;

