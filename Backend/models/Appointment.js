import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    default: null
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // Slot token used by UI (computed token)
  slotId: {
    type: String,
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
      "arrived",
      "consultation-started",
      "consultation-completed",
      "follow-up",
      "in-progress",
      "cancelled",
      "rejected",
      "completed",
      "rescheduled",
      "no-show" // NEW: For no-show feature
    ],
    default: "pending"
  },

  cancellationReason: { type: String, default: "" },
  cancelledBy: { type: String, default: "" },
  cancelledAt: { type: Date, default: null },

  fees: { type: Number, default: 0 },

  // 🩺 NEW: Medical Records (for completed appointments)
  medicalReport: {
    diagnosis: { type: String, default: "" },
    prescription: { type: String, default: "" },
    doctorNotes: { type: String, default: "" },
    followUpDate: { type: Date, default: null }
  },

  checkInTime: { type: Date, default: null },
  consultationStartTime: { type: Date, default: null },
  consultationEndTime: { type: Date, default: null },

  reminderSent: {
    before24h: { type: Boolean, default: false },
    before2h: { type: Boolean, default: false }
  },

  reminderHistory: {
    type: [
      {
        type: { type: String, enum: ["24h", "2h"], required: true },
        sentAt: { type: Date, default: Date.now },
        channel: { type: String, enum: ["status", "email"], default: "status" }
      }
    ],
    default: []
  },

  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prescription",
    default: null
  },

  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AppointmentReview",
    default: null
  },

  // 🔁 NEW: Reference to previous appointment (for rebook feature)
  previousAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    default: null
  }

}, { timestamps: true, collection: "appointments" });

appointmentSchema.pre("validate", function (next) {
  if (!this.doctorId && this.doctor) this.doctorId = this.doctor;
  if (!this.doctor && this.doctorId) this.doctor = this.doctorId;

  if (!this.patientId && this.patient) this.patientId = this.patient;
  if (!this.patient && this.patientId) this.patient = this.patientId;

  next();
});

// 🔒 COMPOUND INDEX: Prevent double booking (same doctor, date, time)
// Only applies to non-cancelled appointments
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $nin: ["cancelled", "no-show"] } 
    }
  }
);

appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model("Appointment", appointmentSchema);
