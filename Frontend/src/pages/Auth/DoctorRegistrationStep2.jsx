import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showToast } from "../../Redux/toastSlice";
import API from "../util/api";

export default function DoctorRegistrationStep2() {
  const location = useLocation();
  const email = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: email,
    medicalQualification: "",
    specialization: "",
    medicalRegistrationId: "",
    yearsOfExperience: "",
    hospitalClinicName: "",
    hospitalClinicAddress: "",
    fees: "",
  });
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const specializations = [
    "Cardiologists",
    "Pediatricians",
    "Neurologists",
    "Dermatologists",
    "Dentists",
    "General Physicians",
  ];

  const qualifications = [
    "MBBS", "BDS", "MD", "MS", "Other"
  ];

  useEffect(() => {
    if (!email) {
      dispatch(showToast({ message: "Please complete step 1 first", type: "error" }));
      navigate("/doctor-registration/step1");
    }
  }, [email, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.medicalQualification || !formData.specialization || 
        !formData.medicalRegistrationId || !formData.yearsOfExperience ||
        !formData.hospitalClinicName || !formData.hospitalClinicAddress ||
        !formData.fees) {
      dispatch(showToast({ message: "Please fill all fields", type: "error" }));
      return;
    }

    if (isNaN(formData.yearsOfExperience) || formData.yearsOfExperience < 0) {
      dispatch(showToast({ message: "Please enter a valid years of experience", type: "error" }));
      return;
    }

    if (isNaN(formData.fees) || formData.fees < 0) {
      dispatch(showToast({ message: "Please enter valid consultation fees", type: "error" }));
      return;
    }

    setLoading(true);
    try {
      await API.post("/doctor-registration/step2", {
        ...formData,
        yearsOfExperience: Number(formData.yearsOfExperience),
        fees: Number(formData.fees),
      });
      
      dispatch(showToast({ 
        message: "Your request has been sent to the admin. Please wait for approval.", 
        type: "success" 
      }));
      
      // Show confirmation page
      navigate("/doctor-registration/confirmation", { state: { email: formData.email } });
    } catch (err) {
      dispatch(showToast({ 
        message: err.response?.data?.message || "Failed to submit request", 
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
          <p className="muted text-sm mt-1">Step 2 of 2: Professional Details</p>
          <div className="mt-4 flex justify-center">
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medical Qualification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Qualification <span className="text-red-500">*</span>
            </label>
            <select
              name="medicalQualification"
              value={formData.medicalQualification}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Qualification</option>
              {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization <span className="text-red-500">*</span>
            </label>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Specialization</option>
              {specializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Medical Registration ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Registration / Doctor ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="medicalRegistrationId"
              value={formData.medicalRegistrationId}
              onChange={handleChange}
              placeholder="REG123456"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Years of Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              placeholder="5"
              min="0"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Hospital/Clinic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital / Clinic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="hospitalClinicName"
              value={formData.hospitalClinicName}
              onChange={handleChange}
              placeholder="City General Hospital"
              className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Hospital/Clinic Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital / Clinic Address <span className="text-red-500">*</span>
            </label>
              <textarea
                name="hospitalClinicAddress"
                value={formData.hospitalClinicAddress}
                onChange={handleChange}
                placeholder="456 Medical Center Drive, City, State, ZIP"
                rows="3"
                className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
          </div>

          {/* Consultation Fees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consultation Fees (₹) <span className="text-red-500">*</span>
            </label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleChange}
                placeholder="500"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/doctor-registration/step1")}
              className="flex-1 py-2.5 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Request to Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}