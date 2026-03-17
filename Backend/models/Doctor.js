import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Professional Details
  medicalQualification: {
    type: String,
    default: "",
  },
  specialization: {
    type: String,
    default: "",
  },
  medicalRegistrationId: {
    type: String,
    default: "",
  },
  yearsOfExperience: {
    type: Number,
    default: 0,
  },
  hospitalClinicName: {
    type: String,
    default: "",
  },
  hospitalClinicAddress: {
    type: String,
    default: "",
  },
  // Legacy fields (for backward compatibility)
  experience: {
    type: Number,
    default: 0,
  },
  fees: {
    type: Number,
    default: 0,
  },
  about: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  profileImage: {
    type: String,
    default: "",
  },
  availability: {
    type: Object,
    default: {},
  },
  // Approval status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Doctor", doctorSchema);
