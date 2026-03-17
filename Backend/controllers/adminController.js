import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";
import DoctorRegistrationRequest from "../models/DoctorRegistrationRequest.js";
import Doctor from "../models/Doctor.js";
import Settings from "../models/Settings.js";

// @desc   Get all doctors (approved + pending)
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("user", "name email role");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// @desc   Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    await doctor.deleteOne();
    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc   Get all patients
export const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc   Delete patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    await patient.deleteOne();
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc   Get single patient by id
// @route  GET /api/admin/patients/:id
// @access Private/Admin
export const getPatientById = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('-password');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =======================
// @desc   Get all pending doctor registration requests
// @route  GET /api/admin/doctor-approvals
// @access Private/Admin
// =======================
export const getPendingDoctorRequests = async (req, res) => {
  try {
    const requests = await DoctorRegistrationRequest.find({ status: "pending" })
      .sort({ submittedAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getPendingDoctorRequests:", error);
    res.status(500).json({ error: error.message || "Failed to fetch requests" });
  }
};

// =======================
// @desc   Get single doctor registration request
// @route  GET /api/admin/doctor-approvals/:id
// @access Private/Admin
// =======================
export const getDoctorRequestById = async (req, res) => {
  try {
    const request = await DoctorRegistrationRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    res.status(200).json(request);
  } catch (error) {
    console.error("Error in getDoctorRequestById:", error);
    res.status(500).json({ error: error.message || "Failed to fetch request" });
  }
};

// =======================
// @desc   Approve doctor registration request
// @route  POST /api/admin/doctor-approvals/:id/approve
// @access Private/Admin
// =======================
export const approveDoctorRequest = async (req, res) => {
  try {
    const request = await DoctorRegistrationRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Generate temporary password (8 characters)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    // Create User account
    const user = await User.create({
      name: request.fullName,
      email: request.email,
      password: hashedTempPassword,
      role: "doctor",
      isVerified: true,
      isApproved: true,
      mustResetPassword: true,
      tempPassword: hashedTempPassword,
      isFirstLogin: false, // Will be set to true after password reset
      age: request.age,
      mobileNumber: request.mobileNumber,
      residentialAddress: request.residentialAddress,
    });

    // Create Doctor profile
    const doctor = await Doctor.create({
      user: user._id,
      medicalQualification: request.medicalQualification,
      specialization: request.specialization,
      medicalRegistrationId: request.medicalRegistrationId,
      yearsOfExperience: request.yearsOfExperience,
      hospitalClinicName: request.hospitalClinicName,
      hospitalClinicAddress: request.hospitalClinicAddress,
      experience: request.yearsOfExperience,
      fees: request.fees,
      location: request.hospitalClinicAddress,
      status: "approved",
    });

    // Update request status
    request.status = "approved";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    // Send approval email
    const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
    const approvalEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Doctor Account Approved</h2>
        <p>Dear ${request.fullName},</p>
        <p>Congratulations! Your doctor registration request has been approved.</p>
        <p>Your account has been created. Please use the following credentials to log in:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${request.email}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 5px 10px; border-radius: 3px;">${tempPassword}</code></p>
        </div>
        <p><strong>Important:</strong> You will be required to reset your password on first login.</p>
        <p>
          <a href="${loginUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Login to Your Account
          </a>
        </p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>Doctor Appointment System Admin</p>
      </div>
    `;

    try {
      await sendEmail(request.email, "Doctor Account Approved", approvalEmailHtml);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Continue even if email fails
    }

    res.status(200).json({ 
      message: "Doctor approved successfully",
      doctor: {
        _id: doctor._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        }
      }
    });
  } catch (error) {
    console.error("Error in approveDoctorRequest:", error);
    res.status(500).json({ error: error.message || "Failed to approve doctor" });
  }
};

// =======================
// @desc   Reject doctor registration request
// @route  POST /api/admin/doctor-approvals/:id/reject
// @access Private/Admin
// =======================
export const rejectDoctorRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const request = await DoctorRegistrationRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Update request status
    request.status = "rejected";
    request.rejectionReason = rejectionReason;
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    // Send rejection email
    const rejectionEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Doctor Registration Request Update</h2>
        <p>Dear ${request.fullName},</p>
        <p>We regret to inform you that your doctor registration request has been reviewed and unfortunately, we are unable to approve it at this time.</p>
        <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
          <p><strong>Reason for Rejection:</strong></p>
          <p>${rejectionReason}</p>
        </div>
        <p>We apologize for any inconvenience this may cause. If you believe this is an error or would like to provide additional information, please feel free to contact our support team.</p>
        <p>Thank you for your interest in joining our platform.</p>
        <p>Best regards,<br>Doctor Appointment System Admin</p>
      </div>
    `;

    try {
      await sendEmail(request.email, "Doctor Registration Request Update", rejectionEmailHtml);
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
      // Continue even if email fails
    }

    res.status(200).json({ 
      message: "Doctor request rejected successfully",
      requestId: request._id
    });
  } catch (error) {
    console.error("Error in rejectDoctorRequest:", error);
    res.status(500).json({ error: error.message || "Failed to reject doctor request" });
  }
};

// =======================
// @desc   Get or create settings
// @route  GET /api/admin/settings
// @access Private/Admin
// =======================
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      // return defaults if none saved yet
      return res.json({
        siteName: "MediBook",
        emailNotifications: true,
        smsNotifications: false,
        timezone: "Asia/Kolkata",
      });
    }
    res.json(settings);
  } catch (error) {
    console.error("Error in getSettings:", error);
    res.status(500).json({ error: error.message || "Failed to get settings" });
  }
};

// =======================
// @desc   Save/update settings
// @route  POST /api/admin/settings
// @access Private/Admin
// =======================
export const saveSettings = async (req, res) => {
  try {
    const payload = {
      siteName: req.body.siteName,
      emailNotifications: req.body.emailNotifications,
      smsNotifications: req.body.smsNotifications,
      timezone: req.body.timezone,
    };

    const updated = await Settings.findOneAndUpdate({}, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json(updated);
  } catch (error) {
    console.error("Error in saveSettings:", error);
    res.status(500).json({ error: error.message || "Failed to save settings" });
  }
};
