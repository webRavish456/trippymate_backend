import mongoose from "mongoose";

const VendorPaymentSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
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
VendorPaymentSchema.index({ vendorId: 1 });
VendorPaymentSchema.index({ bookingId: 1 });
VendorPaymentSchema.index({ status: 1 });
VendorPaymentSchema.index({ paymentDate: 1 });

const VendorPayment = mongoose.model("VendorPayment", VendorPaymentSchema);

export default VendorPayment;

