import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showToast } from "../../Redux/toastSlice";
import { loginSuccess } from "../../Redux/authSlice";
import { setDoctorProfile } from "../../Redux/doctorSlice";
import API from "../util/api";

export default function ResetPassword() {
  const location = useLocation();
  const email = location.state?.email || "";
  const [formData, setFormData] = useState({
    email: email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      dispatch(showToast({ message: "Please fill all fields", type: "error" }));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      dispatch(showToast({ message: "New passwords do not match", type: "error" }));
      return;
    }

    if (formData.newPassword.length < 6) {
      dispatch(showToast({ message: "Password must be at least 6 characters", type: "error" }));
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/auth/reset-password", {
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      dispatch(loginSuccess(data));
      dispatch(showToast({ message: "Password reset successfully!", type: "success" }));

      // Navigate based on role
      if (data.role === "doctor") {
        dispatch(setDoctorProfile(data));
        // Always redirect to profile page after password reset (first login)
        navigate("/doctor/profile");
      } else {
        navigate("/patient/browse-services");
      }
    } catch (err) {
      dispatch(showToast({ 
        message: err.response?.data?.message || "Failed to reset password", 
        type: "error" 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="muted text-sm mt-1">Please set a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              readOnly
            />
          </div>

          {/* Current Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type={showPasswords.current ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter temporary password"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute right-3 top-9 cursor-pointer text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? "🙈" : "👁️"}
            </span>
          </div>

          {/* New Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password (min 6 characters)"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute right-3 top-9 cursor-pointer text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute right-3 top-9 cursor-pointer text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? "🙈" : "👁️"}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
