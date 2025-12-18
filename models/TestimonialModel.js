import mongoose from "mongoose";

const TestimonialSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerImage: {
    type: String
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true
  },
  testimonial: {
    type: String,
    required: true
  },
  tripPackage: {
    type: String
  },
  location: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
}, {
  timestamps: true
});

const Testimonial = mongoose.model("Testimonial", TestimonialSchema);

export default Testimonial;

