import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 🔹 NEW (for slot-based system)
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AppointmentSlot",
    default: null // important for backward compatibility
  },

  // 🔹 OLD (keep for now)
  date: {
    type: String,
    required: false
  },

  time: {
    type: String,
    required: false
  },

  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "in-progress",
      "cancelled",
      "completed",
      "rescheduled",
      "no-show" // NEW: For no-show feature
    ],
    default: "pending"
  },

  fees: { type: Number, default: 0 },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  // 🩺 NEW: Medical Records (for completed appointments)
  medicalReport: {
    diagnosis: { type: String, default: "" },
    prescription: { type: String, default: "" },
    doctorNotes: { type: String, default: "" },
    followUpDate: { type: Date, default: null }
  },

  // 🔁 NEW: Reference to previous appointment (for rebook feature)
  previousAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    default: null
  }

}, { timestamps: true });

// 🔒 COMPOUND INDEX: Prevent double booking (same doctor, date, time)
// Only applies to non-cancelled appointments
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $nin: ["cancelled", "no-show"] } 
    }
  }
);

export default mongoose.model("Appointment", appointmentSchema);
