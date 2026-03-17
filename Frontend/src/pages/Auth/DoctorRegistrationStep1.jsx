import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showToast } from "../../Redux/toastSlice";
import API from "../util/api";
import { Link } from "react-router-dom";

export default function DoctorRegistrationStep1() {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    email: "",
    mobileNumber: "",
    residentialAddress: "",
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
    
    // Validation
    if (!formData.fullName || !formData.age || !formData.email || 
        !formData.mobileNumber || !formData.residentialAddress) {
      dispatch(showToast({ message: "Please fill all fields", type: "error" }));
      return;
    }

    if (isNaN(formData.age) || formData.age < 18 || formData.age > 100) {
      dispatch(showToast({ message: "Please enter a valid age (18-100)", type: "error" }));
      return;
    }

    setLoading(true);
    try {
      await API.post("/doctor-registration/step1", formData);
      dispatch(showToast({ message: "Basic details saved successfully", type: "success" }));
      // Navigate to step 2 with email in state
      navigate("/doctor-registration/step2", { state: { email: formData.email } });
    } catch (err) {
      dispatch(showToast({ 
        message: err.response?.data?.message || "Failed to save basic details", 
        type: "error" 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="card w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg">
            👨‍⚕️
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Registration</h1>
          <p className="muted text-sm mt-1">Step 1 of 2: Basic Details</p>
          <div className="mt-4 flex justify-center">
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "50%" }}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Dr. John Doe"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="30"
              min="18"
              max="100"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@example.com"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Residential Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Residential Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="residentialAddress"
              value={formData.residentialAddress}
              onChange={handleChange}
              placeholder="123 Main Street, City, State, ZIP Code"
              rows="3"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              to="/signup"
              className="flex-1 py-2.5 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition text-center"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue to Step 2"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
