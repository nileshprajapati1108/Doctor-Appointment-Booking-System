import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },
  isVerified: { type: Boolean, default: false },         // ✅ email verification
  verificationToken: { type: String },                  // ✅ verification token
  // Doctor-specific fields
  age: { type: Number },
  mobileNumber: { type: String },
  residentialAddress: { type: String },
  // Patient medical history
  medicalHistory: {
    bloodGroup: { type: String, default: "" },
    allergies: { type: String, default: "" },
    chronicDiseases: { type: String, default: "" },
    pastSurgeries: { type: String, default: "" },
    currentMedications: { type: String, default: "" },
  },
  isApproved: { type: Boolean, default: false },        // For doctors: approval status
  mustResetPassword: { type: Boolean, default: false }, // Force password reset on first login
  tempPassword: { type: String },                      // Temporary password (hashed)
  isFirstLogin: { type: Boolean, default: false },    // Track first login after approval (for profile setup)
}, { timestamps: true });

// Password encryption
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
