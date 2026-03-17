import express from "express";
import { 
  getAllDoctors, 
  deleteDoctor, 
  getAllPatients, 
  getPatientById,
  deletePatient,
  getPendingDoctorRequests,
  getDoctorRequestById,
  approveDoctorRequest,
  rejectDoctorRequest
  , getSettings, saveSettings
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Doctor management
router.get("/doctors", protect, adminOnly, getAllDoctors);
router.delete("/doctors/:id", protect, adminOnly, deleteDoctor);

// Patient management
router.get("/patients", protect, adminOnly, getAllPatients);
router.get("/patients/:id", protect, adminOnly, getPatientById);
router.delete("/patients/:id", protect, adminOnly, deletePatient);

// Doctor approval management
router.get("/doctor-approvals", protect, adminOnly, getPendingDoctorRequests);
router.get("/doctor-approvals/:id", protect, adminOnly, getDoctorRequestById);
router.post("/doctor-approvals/:id/approve", protect, adminOnly, approveDoctorRequest);
router.post("/doctor-approvals/:id/reject", protect, adminOnly, rejectDoctorRequest);

// Settings
router.get("/settings", protect, adminOnly, getSettings);
router.post("/settings", protect, adminOnly, saveSettings);

export default router;
