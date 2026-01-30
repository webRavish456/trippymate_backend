import mongoose from "mongoose";

/**
 * Tracks rewards given to users when their booked trip is completed.
 * Reward = 1% of booking final amount.
 */
const UserRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // One reward per completed booking
    },
    rewardPercent: {
      type: Number,
      default: 1,
    },
    bookingAmount: {
      type: Number,
      required: true, // finalAmount of booking at time of completion
    },
    rewardAmount: {
      type: Number,
      required: true, // 1% of bookingAmount
    },
    status: {
      type: String,
      enum: ["given", "pending"],
      default: "given",
    },
  },
  { timestamps: true }
);

UserRewardSchema.index({ userId: 1 });
UserRewardSchema.index({ bookingId: 1 });
UserRewardSchema.index({ createdAt: -1 });

const UserReward = mongoose.model("UserReward", UserRewardSchema);
export default UserReward;
