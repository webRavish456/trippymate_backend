import mongoose from "mongoose";

const SlotJoinRequestSchema = new mongoose.Schema(
  {
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    guestDetails: [
      {
        guestName: { type: String },
        guestAge: { type: Number },
        guestGender: { type: String },
        guestAddress: { type: String },
      },
    ],
    guestCount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "cancelled"],
      default: "pending",
    },
    slotCreatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    message: {
      type: String, // Optional message from requester
      default: "",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    responseMessage: {
      type: String, // Optional message from slot creator
      default: "",
    },
  },
  { timestamps: true }
);

// Index for faster queries
SlotJoinRequestSchema.index({ slotId: 1, status: 1 });
SlotJoinRequestSchema.index({ requestedBy: 1, status: 1 });
SlotJoinRequestSchema.index({ slotCreatorId: 1, status: 1 });

const SlotJoinRequest = mongoose.model("SlotJoinRequest", SlotJoinRequestSchema);
export default SlotJoinRequest;

