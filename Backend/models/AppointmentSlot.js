import mongoose from "mongoose";

const schema = new mongoose.Schema({
  doctorId: mongoose.Schema.Types.ObjectId,
  date: String,
  startTime: String,
  endTime: String,
  isBooked: { type: Boolean, default: false }
});

export default mongoose.model("AppointmentSlot", schema);
