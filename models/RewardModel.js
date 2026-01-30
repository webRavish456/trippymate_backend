import mongoose from "mongoose";

const RewardSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  userLimit: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

RewardSchema.index({ code: 1 });
RewardSchema.index({ status: 1 });
RewardSchema.index({ validFrom: 1, validUntil: 1 });

const Reward = mongoose.model("Reward", RewardSchema);

export default Reward;
