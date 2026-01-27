import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Packages",
      required: false, // Optional for captain-only bookings
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    guestDetails: [
      {
        guestName: { type: String },
        guestAge: { type: Number },
        guestGender: { type: String },
        guestAddress: { type: String },
        tripDate: { type: Date }, // stored as UTC, format to IST when showing
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Cancelled", "Completed"],
      default: "Active",
    },
    tripdate:{
        type:Date
    },
    couponCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null
    },
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
      default: null
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    },
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
      default: null
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending"
    },
    paymentId: {
      type: String, // Razorpay payment ID
      default: null
    },
    orderId: {
      type: String, // Razorpay order ID
      default: null
    },
    paymentMethod: {
      type: String,
      default: "razorpay"
    },
    baseAmount: {
      type: Number, // Amount before discount
      default: 0
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      default: null
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExploreDestination",
      default: null
    },
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
      default: null
    },
    contactName: {
      type: String
    },
    contactPhone: {
      type: String
    },
    contactAddress: {
      type: String
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    bookingId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking
