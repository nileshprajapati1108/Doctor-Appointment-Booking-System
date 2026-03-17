import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

// Public stats endpoint - returns totals for homepage widgets
export const getPublicStats = async (req, res) => {
  try {
    // Count approved doctors (ensure linked user exists)
    const doctors = await Doctor.find({ status: "approved" }).populate({ path: "user", select: "isApproved isVerified" });
    const approvedDoctors = doctors.filter((d) => d.user && d.user.isApproved && d.user.isVerified);
    const totalDoctors = approvedDoctors.length;

    // Count patients
    const totalPatients = await User.countDocuments({ role: "patient" });

    // Count appointments (all)
    const totalAppointments = await Appointment.countDocuments({});

    res.json({ totalDoctors, totalPatients, totalAppointments });
  } catch (error) {
    console.error("Error in getPublicStats:", error);
    res.status(500).json({ error: error.message });
  }
};

export default getPublicStats;
