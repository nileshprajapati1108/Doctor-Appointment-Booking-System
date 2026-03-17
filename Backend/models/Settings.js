import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "MediBook" },
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  timezone: { type: String, default: "Asia/Kolkata" },
}, { timestamps: true });

const Settings = mongoose.model("Settings", SettingsSchema);
export default Settings;
