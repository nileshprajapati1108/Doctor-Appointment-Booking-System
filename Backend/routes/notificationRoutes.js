import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all user notifications
router.get("/", protect, getNotifications);

// Mark notification as read
router.patch("/:id/read", protect, markNotificationAsRead);

// Delete notifications
router.delete("/:id", protect, deleteNotification);
router.delete("/", protect, deleteAllNotifications);

export default router;
