import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";

const pendingUsers = {}; // In-memory store: { email: { name, password, role, code } }

// =======================
// @desc   Send verification code
// @route  POST /api/auth/register
// @access Public
// =======================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1️⃣ Check if user exists in DB
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // 2️⃣ Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // 3️⃣ Store in memory
    pendingUsers[email] = { name, email, password, role, code };

    // 4️⃣ Send code via email
    const message = `
      <h2>Doctor Appointment System</h2>
      <p>Your verification code is: <strong>${code}</strong></p>
    `;
    await sendEmail(email, "Email Verification Code", message);

    res.status(200).json({ message: "Verification code sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

// =======================
// @desc   Verify code and create user
// @route  POST /api/auth/verify-email
// @access Public
// =======================
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const pending = pendingUsers[email];
    if (!pending) return res.status(400).json({ message: "No pending verification found" });

    if (pending.code !== code) return res.status(400).json({ message: "Invalid code" });

    // ✅ Create user in DB
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      isVerified: true,
    });

    // ✅ Remove from pending
    delete pendingUsers[email];

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// =======================
// @desc   Login user
// @route  POST /api/auth/login
// @access Public
// =======================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    // Check password match (including temporary password)
    let isMatch = await user.matchPassword(password);
    
    // If regular password doesn't match, check temporary password
    if (!isMatch && user.tempPassword) {
      isMatch = await bcrypt.compare(password, user.tempPassword);
    }

    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in." });
    }

    // Check doctor approval status
    if (user.role === "doctor" && !user.isApproved) {
      return res.status(403).json({ 
        message: "Your account is pending approval. Please wait for admin approval." 
      });
    }

    // If user must reset password, return flag
    if (user.mustResetPassword) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustResetPassword: true,
        message: "Please reset your password to continue",
      });
    }

    // Set httpOnly cookie with token
    res.cookie("token", generateToken(user._id, user.role), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Check if this is first login after approval (for doctors)
    const isFirstLogin = user.role === "doctor" && user.isFirstLogin === true;
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      medicalHistory: user.medicalHistory,
      role: user.role,
      token: generateToken(user._id, user.role),
      mustResetPassword: false,
      isFirstLogin: isFirstLogin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// @desc   Verify authentication from cookie
// @route  GET /api/auth/verify
// @access Private
// =======================
export const verifyAuth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      medicalHistory: user.medicalHistory,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// @desc   Reset password (for first login with temporary password)
// @route  POST /api/auth/reset-password
// @access Public (but requires email and temp password verification)
// =======================
export const resetPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Email, current password, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password (can be regular or temporary)
    let isMatch = await user.matchPassword(currentPassword);
    if (!isMatch && user.tempPassword) {
      isMatch = await bcrypt.compare(currentPassword, user.tempPassword);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    user.mustResetPassword = false;
    user.tempPassword = undefined; // Clear temporary password
    // Set first login flag for doctors (to redirect to profile setup)
    if (user.role === "doctor") {
      user.isFirstLogin = true;
    }

    await user.save();

    // Generate new token
    const token = generateToken(user._id, user.role);

    // Set httpOnly cookie with token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set first login flag for doctors (to redirect to profile setup)
    const isFirstLogin = user.role === "doctor" && !user.isFirstLogin;
    if (user.role === "doctor" && !user.isFirstLogin) {
      user.isFirstLogin = true;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      token: token,
      message: "Password reset successfully",
      isFirstLogin: isFirstLogin,
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: error.message || "Failed to reset password" });
  }
};

// =======================
// @desc   Update logged-in user's profile
// @route  PUT /api/auth/profile
// @access Private
// =======================
export const updateProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, password, medicalHistory, profileImage } = req.body;

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (name) user.name = name;
    if (password) user.password = password; // will be hashed by pre-save hook
    if (typeof profileImage === "string") user.profileImage = profileImage;

    if (medicalHistory && user.role === 'patient') {
      user.medicalHistory = { ...user.medicalHistory, ...medicalHistory };
    }

    const updated = await user.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      profileImage: updated.profileImage,
      medicalHistory: updated.medicalHistory,
      role: updated.role,
      token: generateToken(updated._id, updated.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// @desc   Clear first login flag (after profile setup)
// @route  POST /api/auth/clear-first-login
// @access Private
// =======================
export const clearFirstLogin = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isFirstLogin = false;
    await user.save();

    res.json({ message: "First login flag cleared", isFirstLogin: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
