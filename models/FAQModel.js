import mongoose from "mongoose";

const FAQSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["General", "Booking", "Payment", "Cancellation", "Travel", "Other"],
    default: "General"
  },
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }
}, {
  timestamps: true
});

const FAQ = mongoose.model("FAQ", FAQSchema);

export default FAQ;

