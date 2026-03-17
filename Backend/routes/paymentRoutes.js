import express from "express";
import {
  createCashPayment,
  confirmCashPayment,
  getAllPayments,
  getMyPayments
} from "../controllers/paymentController.js";
import {
  protect,
  adminOnly,
  doctorOnly,
  patientOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Patient creates cash payment
router.post("/cash", protect, patientOnly, createCashPayment);

// ✅ Doctor or Admin confirms cash payment
router.put("/:id/confirm", protect, (req, res, next) => {
  if (req.user.role === "doctor" || req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Doctors/Admins only." });
  }
}, confirmCashPayment);

// ✅ Admin gets all payments
router.get("/", protect, adminOnly, getAllPayments);
router.get("/my", protect, patientOnly, getMyPayments);

export default router;
