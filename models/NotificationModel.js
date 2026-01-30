import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    type: {
      type: String,
      enum: ["slot_created", "slot_joined", "slot_full", "booking_confirmed", "trip_reminder", "community_trip_join_request", "community_trip_creation_request", "community_trip_message", "package_booked", "trip_completed", "captain_assigned", "vendor_booking", "join_request_approved", "join_request_rejected"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      default: null,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Packages",
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityTrip",
      default: null,
    },
    requestUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
      default: null,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    // For join/creation requests: hide Approve/Reject only after admin takes action
    actionTaken: {
      type: String,
      enum: ['approved', 'rejected'],
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ adminId: 1, isRead: 1 });
NotificationSchema.index({ captainId: 1, isRead: 1 });
NotificationSchema.index({ vendorId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;

