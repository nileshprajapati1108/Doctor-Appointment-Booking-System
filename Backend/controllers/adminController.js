import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import { sendEmail } from "../utils/sendEmail.js";
import { APPOINTMENT_STATUS } from "../utils/appointmentStatus.js";
import bcrypt from "bcryptjs";

const sendDeletionEmail = async ({ email, name, role }) => {
  if (!email) return;

  const roleTitle = role === "doctor" ? "Doctor" : "Patient";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Account Removed by Admin</h2>
      <p>Dear ${name || roleTitle},</p>
      <p>Your ${roleTitle.toLowerCase()} account has been removed by the admin team.</p>
      <p>If you believe this action was made in error, please contact support.</p>
      <p>Best regards,<br/>Doctor Appointment System Admin</p>
    </div>
  `;

  await sendEmail(email, `${roleTitle} Account Deleted`, html);
};

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("user", "name email role");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("user", "name email _id");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const linkedUserId = doctor.user?._id || doctor.user || doctor.userId;
    const linkedUser = linkedUserId ? await User.findById(linkedUserId).select("name email") : null;

    try {
      await sendDeletionEmail({
        email: linkedUser?.email || doctor.user?.email,
        name: linkedUser?.name || doctor.user?.name,
        role: "doctor"
      });
    } catch (emailError) {
      console.error("Failed to send doctor deletion email:", emailError.message);
    }

    await doctor.deleteOne();

    if (linkedUserId) {
      await User.deleteOne({ _id: linkedUserId });
    }

    if (req.io && linkedUserId) {
      req.io.emit("adminAccountDeleted", {
        role: "doctor",
        userId: linkedUserId,
        message: "Doctor account deleted by admin"
      });
    }

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select("-password");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    let lastAppointment = null;
    let medications = [];

    try {
      const latestAppointment = await Appointment.findOne({
        $or: [{ patient: patient._id }, { patientId: patient._id }],
      })
        .sort({ createdAt: -1 })
        .lean();

      if (latestAppointment) {
        let doctorName = "N/A";
        let specialization = "N/A";

        const doctorId = latestAppointment.doctor || latestAppointment.doctorId;
        if (doctorId) {
          const doctor = await Doctor.findById(doctorId)
            .populate("user", "name email")
            .select("specialization user")
            .lean();

          doctorName = doctor?.user?.name || "N/A";
          specialization = doctor?.specialization || "N/A";
        }

        let prescription = null;
        if (latestAppointment.prescription) {
          prescription = await Prescription.findById(latestAppointment.prescription)
            .select("diagnosis medicines advice followUpDate")
            .lean();
        }

        if (!prescription) {
          prescription = await Prescription.findOne({ appointmentId: latestAppointment._id, deletedAt: null })
            .select("diagnosis medicines advice followUpDate")
            .lean();
        }

        medications = Array.isArray(prescription?.medicines) ? prescription.medicines : [];

        lastAppointment = {
          _id: latestAppointment._id,
          date: latestAppointment.date || null,
          time: latestAppointment.time || null,
          status: latestAppointment.status || null,
          fees: latestAppointment.fees || 0,
          createdAt: latestAppointment.createdAt,
          doctorName,
          specialization,
          diagnosis: prescription?.diagnosis || latestAppointment.medicalReport?.diagnosis || "",
          advice: prescription?.advice || "",
          followUpDate: prescription?.followUpDate || latestAppointment.medicalReport?.followUpDate || null,
          prescriptionNotes: latestAppointment.medicalReport?.prescription || "",
        };
      }
    } catch (innerError) {
      console.error("getPatientById enrichment error:", innerError.message);
    }

    res.json({
      patient,
      lastAppointment,
      medications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select("name email role");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    try {
      await sendDeletionEmail({
        email: patient.email,
        name: patient.name,
        role: "patient"
      });
    } catch (emailError) {
      console.error("Failed to send patient deletion email:", emailError.message);
    }

    await patient.deleteOne();

    if (req.io) {
      req.io.emit("adminAccountDeleted", {
        role: "patient",
        userId: req.params.id,
        message: "Patient account deleted by admin"
      });
    }

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingDoctorRequests = async (req, res) => {
  try {
    const requests = await Doctor.find({ status: "pending" })
      .populate("user", "name email age mobileNumber residentialAddress")
      .sort({ updatedAt: -1 });

    const response = requests.map((doctor) => ({
      _id: doctor._id,
      fullName: doctor.user?.name || "",
      age: doctor.user?.age || 0,
      email: doctor.user?.email || "",
      mobileNumber: doctor.user?.mobileNumber || "",
      residentialAddress: doctor.user?.residentialAddress || "",
      medicalQualification: doctor.medicalQualification || "",
      specialization: doctor.specialization || "",
      medicalRegistrationId: doctor.medicalRegistrationId || "",
      yearsOfExperience: doctor.yearsOfExperience || 0,
      hospitalClinicName: doctor.hospitalClinicName || "",
      hospitalClinicAddress: doctor.hospitalClinicAddress || "",
      fees: doctor.fees || 0,
      status: doctor.status,
      submittedAt: doctor.updatedAt,
      rejectionReason: doctor.rejectionReason || ""
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getPendingDoctorRequests:", error);
    res.status(500).json({ error: error.message || "Failed to fetch requests" });
  }
};

export const getDoctorRequestById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("user", "name email age mobileNumber residentialAddress");

    if (!doctor) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({
      _id: doctor._id,
      fullName: doctor.user?.name || "",
      age: doctor.user?.age || 0,
      email: doctor.user?.email || "",
      mobileNumber: doctor.user?.mobileNumber || "",
      residentialAddress: doctor.user?.residentialAddress || "",
      medicalQualification: doctor.medicalQualification || "",
      specialization: doctor.specialization || "",
      medicalRegistrationId: doctor.medicalRegistrationId || "",
      yearsOfExperience: doctor.yearsOfExperience || 0,
      hospitalClinicName: doctor.hospitalClinicName || "",
      hospitalClinicAddress: doctor.hospitalClinicAddress || "",
      fees: doctor.fees || 0,
      status: doctor.status,
      submittedAt: doctor.updatedAt,
      rejectionReason: doctor.rejectionReason || ""
    });
  } catch (error) {
    console.error("Error in getDoctorRequestById:", error);
    res.status(500).json({ error: error.message || "Failed to fetch request" });
  }
};

export const approveDoctorRequest = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("user");

    if (!doctor) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (doctor.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    const user = doctor.user;
    if (!user) {
      return res.status(404).json({ message: "Linked user not found" });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    user.password = hashedTempPassword;
    user.role = "doctor";
    user.isVerified = true;
    user.isApproved = true;
    user.mustResetPassword = true;
    user.tempPassword = hashedTempPassword;
    user.isFirstLogin = false;
    await user.save();

    doctor.status = "approved";
    doctor.reviewedAt = new Date();
    doctor.reviewedBy = req.user._id;
    doctor.rejectionReason = "";
    await doctor.save();

    const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
    const approvalEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Doctor Account Approved</h2>
        <p>Dear ${user.name},</p>
        <p>Congratulations! Your doctor registration request has been approved.</p>
        <p>Your account has been created. Please use the following credentials to log in:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
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
      await sendEmail(user.email, "Doctor Account Approved", approvalEmailHtml);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    res.status(200).json({
      message: "Doctor approved successfully",
      doctor: {
        _id: doctor._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error("Error in approveDoctorRequest:", error);
    res.status(500).json({ error: error.message || "Failed to approve doctor" });
  }
};

export const getDashboard = async (req, res) => {
  try {
    let totalDoctors = await Doctor.countDocuments();
    const totalPatients = await User.countDocuments({ role: "patient" });

    // Fallback: if Doctor collection is empty but users exist with role 'doctor', count those
    if (!totalDoctors) {
      const doctorUsers = await User.countDocuments({ role: "doctor" });
      if (doctorUsers) totalDoctors = doctorUsers;
    }

    // Robust todays appointments: match by appointment.date string OR createdAt within today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const appointmentsToday = await Appointment.countDocuments({
      $or: [
        { date: startOfDay.toISOString().split("T")[0] },
        { createdAt: { $gte: startOfDay, $lt: endOfDay } }
      ]
    });

    const revenueAgg = await Appointment.aggregate([
      {
        $match: {
          fees: { $gt: 0 },
          status: {
            $nin: [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED, APPOINTMENT_STATUS.NO_SHOW]
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$fees" } } }
    ]);
    const monthlyRevenue = (revenueAgg[0] && revenueAgg[0].total) ? revenueAgg[0].total : 0;

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const now = new Date();
    const trendAgg = await Appointment.aggregate([
      {
        $addFields: {
          trendDate: {
            $ifNull: [
              "$createdAt",
              {
                $dateFromString: {
                  dateString: "$date",
                  format: "%Y-%m-%d",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
        },
      },
      { $match: { trendDate: { $gte: yearStart, $lte: now } } },
      { $group: { _id: { $month: "$trendDate" }, count: { $sum: 1 } } }
    ]);

    const trendCounts = Array.from({ length: 12 }).map((_, idx) => {
      const month = idx + 1;
      const found = trendAgg.find(t => t._id === month);
      return found ? found.count : 0;
    });

    const recentAppointments = await Appointment.find().sort({ createdAt: -1 }).limit(6).populate("patient", "name").populate("doctor", "user");
    const recentDoctors = await Doctor.find().sort({ createdAt: -1 }).limit(6).populate("user", "name");
    const recentPatients = await User.find({ role: "patient" }).sort({ createdAt: -1 }).limit(6);

    const relativeTime = (d) => {
      const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
      if (diff < 60) return `${diff} seconds ago`;
      const mins = Math.floor(diff / 60);
      if (mins < 60) return `${mins} minutes ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} hours ago`;
      const days = Math.floor(hrs / 24);
      if (days < 30) return `${days} days ago`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} months ago`;
      const years = Math.floor(months / 12);
      return `${years} years ago`;
    };

    const activities = [];

    recentDoctors.forEach(d => activities.push({ emoji: "✅", bg: "#f0fdf4", text: `New doctor <b>${d.user?.name || 'Doctor'}</b> added`, time: relativeTime(d.createdAt), createdAt: d.createdAt }));
    recentAppointments.forEach(a => activities.push({ emoji: "📅", bg: "var(--ad-blue-50)", text: `Appointment booked by <b>${a.patient?.name || 'Unknown'}</b>`, time: relativeTime(a.createdAt), createdAt: a.createdAt }));
    recentPatients.forEach(p => activities.push({ emoji: "👤", bg: "#fff7ed", text: `New patient <b>${p.name}</b> registered`, time: relativeTime(p.createdAt), createdAt: p.createdAt }));

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      stats: { totalDoctors, totalPatients, appointmentsToday, monthlyRevenue },
      trendCounts,
      activities: activities.slice(0, 6).map(a => ({ emoji: a.emoji, bg: a.bg, text: a.text, time: a.time }))
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const rejectDoctorRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const doctor = await Doctor.findById(req.params.id).populate("user");

    if (!doctor) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (doctor.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    doctor.status = "rejected";
    doctor.rejectionReason = rejectionReason;
    doctor.reviewedAt = new Date();
    doctor.reviewedBy = req.user._id;
    await doctor.save();

    const rejectionEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Doctor Registration Request Update</h2>
        <p>Dear ${doctor.user?.name || "Doctor"},</p>
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
      if (doctor.user?.email) {
        await sendEmail(doctor.user.email, "Doctor Registration Request Update", rejectionEmailHtml);
      }
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    res.status(200).json({
      message: "Doctor request rejected successfully",
      requestId: doctor._id
    });
  } catch (error) {
    console.error("Error in rejectDoctorRequest:", error);
    res.status(500).json({ error: error.message || "Failed to reject doctor request" });
  }
};

export const sendTestEmail = async (req, res) => {
  try {
    const { email, siteName } = req.body || {};
    const cleanEmail = (email || "").trim();
    const cleanSiteName = (siteName || "Doctor Appointment System").trim();

    if (!cleanEmail) {
      return res.status(400).json({ message: "Support email is required" });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailOk) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${cleanSiteName} - Site Name Updated</h2>
        <p>An admin has updated the site name in your Doctor Appointment System.</p>
        <p>If this change was not expected, please review your admin settings.</p>
      </div>
    `;

    await sendEmail(cleanEmail, `${cleanSiteName} Site Name Updated`, html);

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ message: "Failed to send test email" });
  }
};
