import mongoose from "mongoose";

const schema = new mongoose.Schema({
  doctorId: mongoose.Schema.Types.ObjectId,
  date: String, // YYYY-MM-DD

  isUnavailable: Boolean,

  overrideStartTime: String,
  overrideEndTime: String,

  breakEnabled: Boolean,
  breakStartTime: String,
  breakDuration: Number
});

export default mongoose.model("DoctorAvailabilityException", schema);
