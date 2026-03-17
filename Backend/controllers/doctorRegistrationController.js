import User from "../models/User.js";
import DoctorRegistrationRequest from "../models/DoctorRegistrationRequest.js";
import { sendEmail } from "../utils/sendEmail.js";

// =======================
// @desc   Step 1: Submit basic details
// @route  POST /api/doctor-registration/step1
// @access Public
// =======================
export const submitBasicDetails = async (req, res) => {
  try {
    const { fullName, age, email, mobileNumber, residentialAddress } = req.body;

    // Validate required fields
    if (!fullName || !age || !email || !mobileNumber || !residentialAddress) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists in User model
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if there's already a pending request for this email
    const existingRequest = await DoctorRegistrationRequest.findOne({ 
      email,
      status: "pending"
    });
    if (existingRequest) {
      return res.status(400).json({ message: "A registration request is already pending for this email" });
    }

    // Create or update registration request (only step 1 data)
    let request = await DoctorRegistrationRequest.findOne({ email });
    
    if (request && request.status === "pending") {
      // Update existing pending request
      request.fullName = fullName;
      request.age = age;
      request.mobileNumber = mobileNumber;
      request.residentialAddress = residentialAddress;
      await request.save();
    } else {
      // Create new request
      request = await DoctorRegistrationRequest.create({
        fullName,
        age,
        email,
        mobileNumber,
        residentialAddress,
        status: "pending",
      });
    }

    res.status(200).json({ 
      message: "Basic details saved successfully",
      requestId: request._id 
    });
  } catch (error) {
    console.error("Error in submitBasicDetails:", error);
    res.status(500).json({ message: error.message || "Failed to save basic details" });
  }
};

// =======================
// @desc   Step 2: Submit professional details and finalize request
// @route  POST /api/doctor-registration/step2
// @access Public
// =======================
export const submitProfessionalDetails = async (req, res) => {
  try {
    const {
      email,
      medicalQualification,
      specialization,
      medicalRegistrationId,
      yearsOfExperience,
      hospitalClinicName,
      hospitalClinicAddress,
      fees,
    } = req.body;

    // Validate required fields
    if (!email || !medicalQualification || !specialization || !medicalRegistrationId || 
        !yearsOfExperience || !hospitalClinicName || !hospitalClinicAddress ||
        fees === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find the registration request
    const request = await DoctorRegistrationRequest.findOne({ 
      email,
      status: "pending"
    });

    if (!request) {
      return res.status(404).json({ message: "Registration request not found. Please complete step 1 first." });
    }

    // Update with professional details
    request.medicalQualification = medicalQualification;
    request.specialization = specialization;
    request.medicalRegistrationId = medicalRegistrationId;
    request.yearsOfExperience = Number(yearsOfExperience);
    request.hospitalClinicName = hospitalClinicName;
    request.hospitalClinicAddress = hospitalClinicAddress;
    request.fees = Number(fees);
    request.status = "pending";
    request.submittedAt = new Date();

    await request.save();

    res.status(200).json({ 
      message: "Your request has been sent to the admin. Please wait for approval.",
      requestId: request._id 
    });
  } catch (error) {
    console.error("Error in submitProfessionalDetails:", error);
    res.status(500).json({ message: error.message || "Failed to submit request" });
  }
};

// =======================
// @desc   Get registration request status
// @route  GET /api/doctor-registration/status/:email
// @access Public
// =======================
export const getRegistrationStatus = async (req, res) => {
  try {
    const { email } = req.params;
    const request = await DoctorRegistrationRequest.findOne({ email });
    
    if (!request) {
      return res.status(404).json({ message: "No registration request found" });
    }

    res.status(200).json({
      status: request.status,
      requestId: request._id,
      submittedAt: request.submittedAt,
      rejectionReason: request.rejectionReason,
    });
  } catch (error) {
    console.error("Error in getRegistrationStatus:", error);
    res.status(500).json({ message: error.message || "Failed to get status" });
  }
};
