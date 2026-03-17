// routes/doctorRoutes.js
import express from "express";
import {
  createOrUpdateDoctor,
  getAllDoctors,
  getDoctorById,
  updateAvailability,
  getDoctorDashboard,
  getDoctorProfile
} from "../controllers/doctorController.js";
import { protect, doctorOnly } from "../middleware/authMiddleware.js";
import { upload } from "../utils/multer.js";
import Doctor from "../models/Doctor.js";

const router = express.Router();

// Doctor profile - with error handling middleware
const uploadMiddleware = upload.single("profileImage");

router.post(
  "/profile",
  protect,
  doctorOnly,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error("❌ Multer error:", err.message);
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      next();
    });
  },
  createOrUpdateDoctor
);

// Get all approved doctors
router.get("/", getAllDoctors);

// Dashboard must come before /:id to prevent /:id from catching /dashboard
router.get("/dashboard", protect, doctorOnly, getDoctorDashboard);

router.get("/me", protect, doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found yet" });
    res.json(doctor);
  } catch (err) {
    console.error("Error fetching /doctors/me:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get complete doctor profile (with User data combined)
router.get("/profile", protect, doctorOnly, getDoctorProfile);

// must come after /me and /dashboard
router.get("/:id", getDoctorById);







// Update availability
router.put("/availability", protect, doctorOnly, updateAvailability);

export default router;
