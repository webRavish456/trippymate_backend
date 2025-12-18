import mongoose from "mongoose";

const CaptainAssignmentSchema = new mongoose.Schema({
  captainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Captain',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Packages',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  notes: {
    type: String
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

// Index for faster queries
CaptainAssignmentSchema.index({ captainId: 1 });
CaptainAssignmentSchema.index({ packageId: 1 });
CaptainAssignmentSchema.index({ bookingId: 1 });
CaptainAssignmentSchema.index({ status: 1 });

const CaptainAssignment = mongoose.model("CaptainAssignment", CaptainAssignmentSchema);

export default CaptainAssignment;

