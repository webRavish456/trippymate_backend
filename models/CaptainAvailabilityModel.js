import mongoose from "mongoose";

const CaptainAvailabilitySchema = new mongoose.Schema({
  captainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Captain',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'unavailable', 'booked'],
    default: 'available'
  },
  reason: {
    type: String
  },
  notes: {
    type: String
  },
  customerName: {
    type: String
  },
  customerEmail: {
    type: String
  },
  customerPhone: {
    type: String
  },
  bookingReference: {
    type: String
  }
}, { timestamps: true });

// Index for faster queries
CaptainAvailabilitySchema.index({ captainId: 1, date: 1 });
CaptainAvailabilitySchema.index({ date: 1 });

const CaptainAvailability = mongoose.model("CaptainAvailability", CaptainAvailabilitySchema);

export default CaptainAvailability;

