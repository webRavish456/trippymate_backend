import mongoose from "mongoose";

const CaptainPaymentSchema = new mongoose.Schema({
  captainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Captain',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaptainAssignment',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cash', 'cheque'],
    default: 'bank_transfer'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  notes: {
    type: String
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

// Index for faster queries
CaptainPaymentSchema.index({ captainId: 1 });
CaptainPaymentSchema.index({ bookingId: 1 });
CaptainPaymentSchema.index({ status: 1 });
CaptainPaymentSchema.index({ paymentDate: 1 });

const CaptainPayment = mongoose.model("CaptainPayment", CaptainPaymentSchema);

export default CaptainPayment;

