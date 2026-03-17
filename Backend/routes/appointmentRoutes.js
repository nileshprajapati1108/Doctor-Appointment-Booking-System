import express from "express";
import {
  bookAppointment,
  getPatientAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  getMedicalHistory,
  rebookAppointment
} from "../controllers/appointmentController.js";

import { protect, patientOnly, doctorOnly, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Patient actions
router.post("/book", protect, patientOnly, bookAppointment);
router.get("/my", protect, patientOnly, getPatientAppointments);
router.put("/:id/cancel", protect, patientOnly, cancelAppointment);
router.put("/:id/reschedule", protect, patientOnly, rescheduleAppointment);

// 🩺 NEW: Medical history & rebook
router.get("/medical-history", protect, patientOnly, getMedicalHistory);
router.post("/:id/rebook", protect, patientOnly, rebookAppointment);

// Doctor actions
router.get("/doctor", protect, doctorOnly, getDoctorAppointments);
router.put("/:id", protect, doctorOnly, updateAppointmentStatus);
// Admin can also update appointment status (approve/cancel)
router.put("/:id/admin", protect, adminOnly, updateAppointmentStatus);

// Admin actions
router.get("/all", protect, adminOnly, getAllAppointments);

// Get single appointment (must be last to avoid conflicts)
router.get("/:id", protect, patientOnly, getAppointmentById);

export default router;
