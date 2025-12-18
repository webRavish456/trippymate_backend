import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Packages",
      required: true,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExploreDestination",
      required: true,
    },
    destinationName: {
      type: String,
      required: true,
    },
    tripDate: {
      type: Date,
      required: true,
    },
    maxSlots: {
      type: Number,
      default: 10, // Maximum number of bookings allowed in this slot
    },
    currentBookings: {
      type: Number,
      default: 0,
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    status: {
      type: String,
      enum: ["available", "full", "closed"],
      default: "available",
    },
    slotName: {
      type: String, // e.g., "Slot 1 - Delhi to Manali"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    initialGuestDetails: [
      {
        guestName: { type: String },
        guestAge: { type: Number },
        guestGender: { type: String },
        guestAddress: { type: String },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
SlotSchema.index({ packageId: 1, destinationId: 1, tripDate: 1 });
SlotSchema.index({ status: 1, tripDate: 1 });

// Method to check if slot is available
SlotSchema.methods.isAvailable = function () {
  return this.currentBookings < this.maxSlots && this.status === "available";
};

// Method to add booking to slot
SlotSchema.methods.addBooking = function (bookingId) {
  if (this.isAvailable()) {
    this.bookings.push(bookingId);
    this.currentBookings = this.bookings.length;
    
    if (this.currentBookings >= this.maxSlots) {
      this.status = "full";
    }
    
    return true;
  }
  return false;
};

// Method to remove booking from slot
SlotSchema.methods.removeBooking = function (bookingId) {
  this.bookings = this.bookings.filter(
    (id) => id.toString() !== bookingId.toString()
  );
  this.currentBookings = this.bookings.length;
  
  if (this.status === "full" && this.currentBookings < this.maxSlots) {
    this.status = "available";
  }
};

const Slot = mongoose.model("Slot", SlotSchema);
export default Slot;

