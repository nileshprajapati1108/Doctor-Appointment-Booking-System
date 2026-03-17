import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showToast } from "../../Redux/toastSlice";
import API from "../util/api";
import { loginSuccess } from "../../Redux/authSlice";
import { setPatientData } from "../../Redux/patientSlice";
import { Link } from "react-router-dom";


export default function Signup() {
  const [stage, setStage] = useState("signup"); // signup | verify
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignup = async () => {
    // For patients, continue with normal registration
    if (password !== confirmPassword) {
      dispatch(showToast({ message: "Passwords do not match!", type: "error" }));
      return;
    }

    try {
      await API.post("/auth/register", { name, email, password, role: "patient" });
      setStage("verify");
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Signup failed", type: "error" }));
    }
  };

  const handleVerify = async () => {
    try {
      const res = await API.post("/auth/verify-email", { email, code: verificationCode });

      // Save user in Redux
      dispatch(loginSuccess({ user: res.data, token: res.data.token }));

      // Navigate to patient dashboard
      dispatch(setPatientData(res.data));
      navigate("/patient/browse-services");
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Verification failed", type: "error" }));
    }
  };

  if (stage === "verify") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="card w-96 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Email</h1>
            <p className="muted text-sm">Enter the code sent to <strong>{email}</strong></p>
          </div>

          <input
            type="text"
            placeholder="Enter verification code"
            className="w-full mb-4 px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />

          <button
            className="w-full py-2.5 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600"
            onClick={handleVerify}
          >
            Verify Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="card w-96 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg">H</div>
          <h1 className="text-2xl font-bold text-gray-800">Join Happy Health</h1>
          <p className="muted text-sm mt-1">Create your patient account to get started</p>
        </div>

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full mb-4 px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Confirm Password */}
        <div className="relative mb-6">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button
          className="w-full py-2.5 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
          onClick={handleSignup}
        >
          Create Account
        </button>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-center muted">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Sign in
            </Link>
          </p>
          <div className="text-center">
            <span className="text-sm text-gray-600">Are you a doctor? </span>
            <Link 
              to="/doctor-registration/step1" 
              className="text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline"
            >
              Become a Doctor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
