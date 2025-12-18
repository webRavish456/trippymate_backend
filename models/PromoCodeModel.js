import mongoose from "mongoose";

const PromoCodeSchema = new mongoose.Schema({
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
    default: null // For percentage discounts
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
    default: 1 // How many times a single user can use
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

// Index for faster queries
PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ status: 1 });
PromoCodeSchema.index({ validFrom: 1, validUntil: 1 });

const PromoCode = mongoose.model("PromoCode", PromoCodeSchema);

export default PromoCode;

