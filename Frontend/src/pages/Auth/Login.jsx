import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import API from "../util/api";
import { loginSuccess } from "../../Redux/authSlice";
import { setDoctorProfile } from "../../Redux/doctorSlice";
import { setPatientData } from "../../Redux/patientSlice";
import { showToast } from "../../Redux/toastSlice";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      dispatch(showToast({ message: "Please enter both email and password", type: "warning" }));
      return;
    }

    try {
      const { data } = await API.post("/auth/login", { email, password });

      // Check if password reset is required
      if (data.mustResetPassword) {
        dispatch(showToast({ 
          message: "Please reset your password to continue", 
          type: "warning" 
        }));
        navigate("/reset-password", { state: { email: email } });
        return;
      }

      // Save user data in Redux
      dispatch(loginSuccess(data));
      dispatch(showToast({ message: "Login successful! Redirecting...", type: "success" }));

      // Navigate based on actual role from database
      if (data.role === "doctor") {
        dispatch(setDoctorProfile(data));
        // Redirect to profile page if first login after approval
        if (data.isFirstLogin) {
          navigate("/doctor/profile");
        } else {
          navigate("/doctor");
        }
      } else if (data.role === "patient") {
        dispatch(setPatientData(data));
        navigate("/patient/browse-services");
      } else if (data.role === "admin") {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Login failed:", error);
      dispatch(showToast({ message: error.response?.data?.message || "Invalid email or password", type: "error" }));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="card w-96 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg">H</div>
          <h1 className="text-2xl font-bold text-gray-800">Happy Health</h1>
          <p className="muted text-sm mt-1">Welcome back — sign in to continue</p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium muted mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium muted mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 cursor-pointer text-gray-400 hover:text-gray-600"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Forgot Password */}
        <div className="mb-6 text-right">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
            Forgot password?
          </a>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-2.5 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
        >
          Sign In
        </button>

        <div className="mt-6 text-center text-sm muted space-y-2">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-medium hover:text-blue-700">
              Sign up
            </Link>
          </p>
          <p>
            <Link to="/" className="text-blue-600 font-medium hover:text-blue-700">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
