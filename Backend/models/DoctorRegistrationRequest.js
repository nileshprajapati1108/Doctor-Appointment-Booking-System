import mongoose from "mongoose";


const doctorRegistrationRequestSchema = new mongoose.Schema({
  // Step 1 - Basic Details
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, lowercase: true },
  mobileNumber: { type: String, required: true },
  residentialAddress: { type: String, required: true },
  
  // Step 2 - Professional Details (optional until step 2 is completed)
  medicalQualification: { type: String, default: "" },
  specialization: { type: String, default: "" },
  medicalRegistrationId: { type: String, default: "" },
  yearsOfExperience: { type: Number, default: 0 },
  hospitalClinicName: { type: String, default: "" },
  hospitalClinicAddress: { type: String, default: "" },
  fees: { type: Number, default: 0 },
  
  // Status and metadata
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  rejectionReason: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
}, { timestamps: true });

doctorRegistrationRequestSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model("DoctorRegistrationRequest", doctorRegistrationRequestSchema);
