import mongoose from "mongoose";

const schema = new mongoose.Schema({
  doctorId: mongoose.Schema.Types.ObjectId,
  dayOfWeek: Number, // 0-6

  startTime: String,
  endTime: String,

  breakEnabled: Boolean,
  breakStartTime: String,
  breakDuration: Number
});

export default mongoose.model("DoctorWeeklyAvailability", schema);
