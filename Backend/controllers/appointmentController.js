import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Notification from "../models/notification.js";
import Slot from "../models/AppointmentSlot.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

// 🩺 Book Appointment
/*export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    console.log("📅 Booking appointment:", { doctorId, date, time, userId: req.user?._id });

    // 🩻 Find doctor + linked user
    const doctor = await Doctor.findById(doctorId).populate("user", "name email isApproved");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Check if doctor is approved
    if (doctor.status !== "approved" || !doctor.user || !doctor.user.isApproved) {
      return res.status(403).json({ message: "This doctor is not approved to accept appointments yet" });
    }

    // 🧍 Find patient
    const patient = await User.findById(req.user._id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (!doctor.user) {
      console.warn("⚠️ Doctor has no linked user record");
      return res.status(400).json({ message: "Doctor user link missing in database" });
    }

    // 📅 Create appointment
    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: req.user._id,
      date,
      time,
      status: "pending",
      fees: doctor.fees || 0,
    });

    console.log("✅ Appointment created:", appointment._id);

    // 🔔 Create notification for doctor
    try {
      await Notification.create({
        user: doctor.user._id,
        message: `New appointment from ${patientName} on ${date} at ${time}`,
        type: "appointment",
      });
    } catch (notifError) {
      console.error("❌ Notification creation failed:", notifError.message);
    }

    // ✉️ Send emails
    try {
      console.log("📧 Sending emails...");

      const doctorName = doctor.user?.name || "Doctor";
      const patientName = patient.name || "Patient";

      await sendEmail(
        patient.email,
        "Appointment Booked Successfully",
        `<h2>Hi ${patientName},</h2>
         <p>Your appointment with <strong>Dr. ${doctorName}</strong> is booked on <b>${date}</b> at <b>${time}</b>.</p>
         <p>Status: <b>${appointment.status}</b></p>`
      );

      await sendEmail(
        doctor.user.email,
        "New Appointment Alert",
        `<h2>New Appointment Booked!</h2>
         <p>Patient: ${patientName}</p>
         <p>Date: ${date}</p>
         <p>Time: ${time}</p>`
      );

      console.log("✅ Emails sent successfully");
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
    }

    res.status(201).json({ message: "Appointment booked successfully", appointment });
  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ error: error.message });
  }
};*/
export const bookAppointment = async (req, res) => {
  try {
    const { slotId } = req.body;

    console.log("📅 Booking slot:", { slotId, userId: req.user?._id });

    // 🔒 Fetch slot (Initial check)
    const slotCheck = await Slot.findById(slotId);
    if (!slotCheck || slotCheck.isBooked) {
      return res.status(400).json({ message: "Slot unavailable or already booked" });
    }

    // 🚫 ENHANCED: Check for double booking (same doctor, date, time)
    const doubleBookCheck = await Appointment.findOne({
      doctor: slotCheck.doctorId,
      date: slotCheck.date,
      time: slotCheck.startTime,
      status: { $nin: ["cancelled", "no-show"] }
    });

    if (doubleBookCheck) {
      return res.status(400).json({ 
        message: "This time slot is already booked with this doctor" 
      });
    }

    // 🩺 Find doctor
    const doctor = await Doctor.findById(slotCheck.doctorId).populate(
      "user",
      "name email isApproved"
    );
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.status !== "approved" || !doctor.user?.isApproved) {
      return res
        .status(403)
        .json({ message: "Doctor not approved to accept appointments" });
    }

    // 🧍 Find patient
    const patient = await User.findById(req.user._id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // 🚫 Check for existing appointment on the same day
    const existingAppointment = await Appointment.findOne({
      patient: req.user._id,
      date: slotCheck.date,
      status: { $nin: ["cancelled", "rejected"] },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "You already have an appointment on this date." });
    }

    // � Atomic Lock: Ensure slot is still available and mark as booked
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({ message: "Slot was just booked by someone else" });
    }

    // 📅 Create appointment
    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient._id,

      slotId: slot._id,
      date: slot.date,
      time: slot.startTime,

      status: "pending",
      fees: doctor.fees || 0
    });

    console.log("✅ Appointment created:", appointment._id);

    // 🔔 Notification
    try {
      await Notification.create({
        user: doctor.user._id,
        message: `New appointment from ${patient.name} on ${appointment.date} at ${appointment.time}`,
        type: "appointment"
      });
    } catch (e) {
      console.error("❌ Notification failed:", e.message);
    }

    // ✉️ Emails
    try {
      const doctorName = doctor.user.name;
      const patientName = patient.name;

      await sendEmail(
        patient.email,
        "Appointment Booked Successfully",
        `<h2>Hi ${patientName},</h2>
         <p>Your appointment with <b>Dr. ${doctorName}</b> is booked on <b>${appointment.date}</b> at <b>${appointment.time}</b>.</p>
         <p>Status: <b>${appointment.status}</b></p>`
      );

      await sendEmail(
        doctor.user.email,
        "New Appointment Alert",
        `<h2>New Appointment Booked</h2>
         <p>Patient: ${patientName}</p>
         <p>Date: ${appointment.date}</p>
         <p>Time: ${appointment.time}</p>`
      );
    } catch (e) {
      console.error("❌ Email failed:", e.message);
    }

    // Populate appointment details for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({
        path: "doctor",
        select: "hospitalClinicName specialization location fees",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .populate("patient", "name email medicalHistory");

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: populatedAppointment
    });

  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🧾 Get single appointment details (for receipt)
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })
      .populate({
        path: "doctor",
        select: "hospitalClinicName specialization location fees",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("patient", "name email medicalHistory");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🧾 Get patient's own appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate({
        path: "doctor",
        select: "specialization fees user",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .populate("patient", "name email medicalHistory")
      .sort({ date: -1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ❌ Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })
      .populate("doctor", "user")
      .populate("patient", "name");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "cancelled";
    await appointment.save();

    // 🔓 Free up the slot
    if (appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, { isBooked: false });
    }

    //  Create notification for doctor
    try {
      await Notification.create({
        user: appointment.doctor.user,
        message: `Appointment with ${appointment.patient.name} on ${appointment.date} has been cancelled by the patient.`,
        type: "appointment",
      });
    } catch (notifError) {
      console.error("❌ Notification creation failed:", notifError.message);
    }

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔁 Reschedule appointment
export const rescheduleAppointment = async (req, res) => {
  try {
    const { slotId } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })
      .populate("doctor", "user")
      .populate("patient", "name");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    // 🔒 Validate and lock new slot
    const newSlot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true },
      { new: true }
    );

    if (!newSlot) {
      return res.status(400).json({ message: "Selected slot is unavailable" });
    }

    // 🔓 Free up the old slot
    if (appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, { isBooked: false });
    }

    appointment.slotId = newSlot._id;
    appointment.date = newSlot.date;
    appointment.time = newSlot.startTime;
    appointment.status = "rescheduled";
    await appointment.save();

    // 🔔 Create notification for doctor
    try {
      await Notification.create({
        user: appointment.doctor.user,
        message: `Appointment with ${appointment.patient.name} has been rescheduled to ${appointment.date} at ${appointment.time}.`,
        type: "appointment",
      });
    } catch (notifError) {
      console.error("❌ Notification creation failed:", notifError.message);
    }

    res.json({ message: "Appointment rescheduled successfully", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👨‍⚕️ Doctor - get all appointments for logged-in doctor
export const getDoctorAppointments = async (req, res) => {
  try {
    // 1️⃣ Find doctor document using logged-in USER ID
    const doctorDoc = await Doctor.findOne({ user: req.user._id });

    if (!doctorDoc) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // 2️⃣ Find appointments linked to DOCTOR DOCUMENT ID with proper population
    const appointments = await Appointment.find({ doctor: doctorDoc._id })
      .populate("patient", "name email medicalHistory")
      .populate({
        path: "doctor",
        select: "specialization fees user",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .sort({ date: -1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🧑‍💼 Admin - get all appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "doctor",
        select: "specialization fees user",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .populate("patient", "name email medicalHistory")
      .sort({ date: -1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Doctor approves or cancels appointment
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, medicalReport } = req.body;
    
    // Validate status
    const validStatuses = ["pending", "approved", "in-progress", "cancelled", "completed", "rescheduled", "no-show"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name email medicalHistory")
      .populate({
        path: "doctor",
        select: "user",
        populate: {
          path: "user",
          select: "name email _id"
        }
      });

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    // 🩺 NEW: Validate completed status requires medical report
    if (status === "completed") {
      if (!medicalReport || !medicalReport.diagnosis || !medicalReport.prescription) {
        return res.status(400).json({ 
          message: "Diagnosis and Prescription are required to complete the appointment" 
        });
      }
      appointment.medicalReport = {
        diagnosis: medicalReport.diagnosis,
        prescription: medicalReport.prescription,
        doctorNotes: medicalReport.doctorNotes || "",
        followUpDate: medicalReport.followUpDate || null
      };
    }

    // 🚫 NEW: Validate no-show status (only after 15 mins past appointment time)
    if (status === "no-show") {
      const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
      const currentTime = new Date();
      const timeDiff = currentTime - appointmentDateTime;
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

      if (timeDiff < fifteenMinutes) {
        return res.status(400).json({ 
          message: "No-show status can only be set 15 minutes after appointment time" 
        });
      }
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // 🔓 Free up the slot if cancelled or no-show
    if ((status === "cancelled" || status === "no-show") && appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, { isBooked: false });
    }

    // 🔔 Create notification for patient
    try {
      let message = "";
      if (status === "approved") {
        message = `Your appointment with Dr. ${appointment.doctor.user?.name} on ${appointment.date} at ${appointment.time} has been approved!`;
      } else if (status === "cancelled") {
        message = `Your appointment with Dr. ${appointment.doctor.user?.name} on ${appointment.date} has been cancelled.`;
      } else if (status === "in-progress") {
        message = `Your appointment with Dr. ${appointment.doctor.user?.name} is now in progress.`;
      } else if (status === "completed") {
        message = `Your appointment with Dr. ${appointment.doctor.user?.name} has been completed. Thank you!`;
      } else if (status === "no-show") {
        message = `Your appointment with Dr. ${appointment.doctor.user?.name} on ${appointment.date} was marked as no-show.`;
      }

      if (message) {
        await Notification.create({
          user: appointment.patient._id,
          message: message,
          type: "appointment",
        });
      }
    } catch (notifError) {
      console.error("❌ Notification creation failed:", notifError.message);
    }

    // Send notification email to patient
    try {
      if (status === "approved" || status === "cancelled" || status === "completed") {
        await sendEmail(
          appointment.patient.email,
          `Appointment ${status === "approved" ? "Approved" : status === "completed" ? "Completed" : "Cancelled"}`,
          `<h2>Hi ${appointment.patient.name},</h2>
           <p>Your appointment with <strong>Dr. ${appointment.doctor.user?.name}</strong> has been <b>${status}</b>.</p>
           <p>Date: ${appointment.date}</p>
           <p>Time: ${appointment.time}</p>`
        );
      }
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
    }

    // 🔴 NEW: Emit Socket.io event for real-time update
    if (req.io) {
      req.io.emit("appointmentStatusUpdate", {
        appointmentId: appointment._id,
        status: appointment.status,
        patientId: appointment.patient._id,
        doctorId: appointment.doctor._id
      });
    }

    res.json({ message: "Status updated successfully", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🩺 NEW: Get Medical History (completed appointments)
export const getMedicalHistory = async (req, res) => {
  try {
    const medicalHistory = await Appointment.find({
      patient: req.user._id,
      status: "completed"
    })
      .populate({
        path: "doctor",
        select: "specialization fees user hospitalClinicName",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .populate("patient", "name email medicalHistory")
      .sort({ date: -1 });

    res.json(medicalHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔁 NEW: Rebook Appointment with Same Doctor
export const rebookAppointment = async (req, res) => {
  try {
    const { slotId } = req.body;
    const previousAppointmentId = req.params.id;

    // Get previous appointment
    const previousAppointment = await Appointment.findOne({
      _id: previousAppointmentId,
      patient: req.user._id,
      status: "completed"
    });

    if (!previousAppointment) {
      return res.status(404).json({ 
        message: "Previous appointment not found or not completed" 
      });
    }

    // Check slot availability
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({ message: "Selected slot is unavailable" });
    }

    // Validate same doctor
    if (slot.doctorId.toString() !== previousAppointment.doctor.toString()) {
      // Rollback slot
      await Slot.findByIdAndUpdate(slotId, { isBooked: false });
      return res.status(400).json({ 
        message: "Selected slot does not belong to the same doctor" 
      });
    }

    // Get doctor info for fee
    const doctor = await Doctor.findById(slot.doctorId).populate("user", "name email");
    
    // Create new appointment with reference to previous one
    const newAppointment = await Appointment.create({
      doctor: slot.doctorId,
      patient: req.user._id,
      slotId: slot._id,
      date: slot.date,
      time: slot.startTime,
      status: "pending",
      fees: doctor.fees || 0,
      previousAppointment: previousAppointmentId
    });

    // Populate for response
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate({
        path: "doctor",
        select: "hospitalClinicName specialization location fees",
        populate: { path: "user", select: "name email" }
      })
      .populate("patient", "name email");

    // Notification & Email
    try {
      const patient = await User.findById(req.user._id);
      await Notification.create({
        user: doctor.user._id,
        message: `${patient.name} has rebooked an appointment for ${slot.date} at ${slot.startTime}`,
        type: "appointment"
      });

      await sendEmail(
        patient.email,
        "Appointment Rebooked Successfully",
        `<h2>Hi ${patient.name},</h2>
         <p>Your appointment with <b>Dr. ${doctor.user.name}</b> has been rebooked.</p>
         <p>Date: ${slot.date}</p>
         <p>Time: ${slot.startTime}</p>`
      );
    } catch (e) {
      console.error("Notification/Email failed:", e.message);
    }

    res.status(201).json({
      message: "Appointment rebooked successfully",
      appointment: populatedAppointment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};