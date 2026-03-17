import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["appointment", "system", "message"],
    default: "system",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  link: { // Optional: URL to navigate to on click
    type: String,
  }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);