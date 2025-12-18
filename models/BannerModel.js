import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  image: {
    type: String,
    required: true
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  link: {
    type: String
  },
  position: {
    type: String,
    enum: ['homepage', 'destination', 'package', 'other'],
    default: 'homepage'
  },
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  validFrom: {
    type: Date
  },
  validUntil: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

const Banner = mongoose.model("Banner", BannerSchema);

export default Banner;

