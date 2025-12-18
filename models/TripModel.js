import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  tripName:{type:String,required:true},
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number },
  totalSeats: { type: Number },
  status: { type: String, enum: ["Open", "Closed", "Completed"], default: "Open" },
  departureLocation: { type: String },
  guide: { type: String },
  image:{type:String}
}, { timestamps: true });

export default mongoose.model("Trip", tripSchema);
