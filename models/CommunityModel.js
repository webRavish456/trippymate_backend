import mongoose from "mongoose";

const CommunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  type: {
    type: String,
    enum: ['blog', 'event', 'testimonial', 'story', 'other'],
    default: 'other'
  },
  author: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

const Community = mongoose.model("Community", CommunitySchema);

export default Community;

