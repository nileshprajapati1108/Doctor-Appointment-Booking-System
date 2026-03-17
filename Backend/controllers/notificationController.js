import Notification from "../models/notification.js";
import nodemailer from "nodemailer";

// 🧩 Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // you can use any provider (like Outlook)
  auth: {
    user: process.env.EMAIL_USER, // your sender email
    pass: process.env.EMAIL_PASS, // app password (not your login password)
  },
});

// 📩 Create and send notification
export const createNotification = async (userId, message, type = "general") => {
  try {
    // Save notification in DB
    const notification = await Notification.create({ user: userId, message, type });

    // Find user’s email
    const user = await User.findById(userId);
    if (user && user.email) {
      // Send email alert
      await transporter.sendMail({
        from: `"Doctor Booking System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `New ${type} notification`,
        text: message,
      });
    }

    return notification;
  } catch (error) {
    console.error("❌ Notification Error:", error.message);
  }
};

// 📥 Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ Delete a single notification
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete ALL notifications for the user
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    notification.isRead = true;
    await notification.save();
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
