import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showToast } from "../../Redux/toastSlice";
import API from "../util/api";
import { loginSuccess } from "../../Redux/authSlice";
import { setPatientData } from "../../Redux/patientSlice";
import Loader from "../../Componet/Loader";
import { User, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { useSiteName } from "../../utils/siteName";

export default function Signup() {
  const [stage, setStage] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const siteName = useSiteName();
  const siteInitial = siteName.trim().charAt(0).toUpperCase() || "H";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      dispatch(showToast({ message: "Passwords do not match!", type: "error" }));
      return;
    }
    try {
      setLoading(true);
      await API.post("/auth/register", { name, email, password, role: "patient" });
      setStage("verify");
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Signup failed", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      const res = await API.post("/auth/verify-email", { email, code: verificationCode });
      dispatch(loginSuccess(res.data));
      dispatch(setPatientData(res.data));
      dispatch(showToast({ message: "Account created successfully!", type: "success" }));
      navigate("/patient/profile");
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Verification failed", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const inputStyle = {
    width: "100%",
    padding: "11px 14px 11px 40px",
    borderRadius: "10px",
    border: "1px solid #dbeafe",
    background: "#f8faff",
    fontSize: "14px",
    color: "#1e3a5f",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  // ── VERIFY STAGE ──
  if (stage === "verify") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #eff6ff 0%, #ffffff 50%, #e0f2fe 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* blobs */}
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "#bfdbfe", filter: "blur(90px)", opacity: 0.3, top: -100, right: -80, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "#7dd3fc", filter: "blur(80px)", opacity: 0.2, bottom: -60, left: -60, pointerEvents: "none" }} />

        <div style={{
          width: "100%", maxWidth: "420px",
          background: "#fff", borderRadius: "24px",
          padding: "40px 36px",
          border: "1px solid #dbeafe",
          boxShadow: "0 20px 60px rgba(37,99,235,0.12)",
          position: "relative", zIndex: 1,
        }}>
          {/* Icon */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              border: "2px solid #bfdbfe",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 4px 16px rgba(37,99,235,0.12)",
            }}>
              <ShieldCheck size={26} style={{ color: "#2563eb" }} />
            </div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#1e3a5f", fontFamily: "'Sora', sans-serif" }}>
              Verify Your Email
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              We sent a code to <strong style={{ color: "#2563eb" }}>{email}</strong>.<br />Enter it below to activate your account.
            </p>
          </div>

          {/* Code input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}><ShieldCheck size={11} /> Verification Code</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#60a5fa", pointerEvents: "none" }}>
                <ShieldCheck size={15} />
              </span>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={loading}
                style={{
                  ...inputStyle,
                  textAlign: "center",
                  fontSize: "18px",
                  fontWeight: "700",
                  letterSpacing: "0.2em",
                  paddingLeft: "14px",
                }}
                onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                onBlur={(e) => e.target.style.borderColor = "#dbeafe"}
              />
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || !verificationCode.trim()}
            style={{
              width: "100%", padding: "13px",
              borderRadius: "12px", border: "none",
              background: !verificationCode.trim()
                ? "#93c5fd"
                : "linear-gradient(135deg, #2563eb, #38bdf8)",
              color: "#fff", fontSize: "15px", fontWeight: "700",
              cursor: !verificationCode.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: verificationCode.trim() ? "0 6px 20px rgba(37,99,235,0.3)" : "none",
              fontFamily: "inherit",
            }}
          >
            {loading
              ? <><Loader2 size={17} style={{ animation: "spin 0.8s linear infinite" }} /> Verifying...</>
              : <><ShieldCheck size={17} /> Verify Email</>
            }
          </button>

          <p style={{ margin: "16px 0 0", textAlign: "center", fontSize: "13px", color: "#94a3b8" }}>
            Didn't receive the code?{" "}
            <button
              onClick={() => setStage("signup")}
              style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
            >
              Go back
            </button>
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── SIGNUP STAGE ──
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #eff6ff 0%, #ffffff 50%, #e0f2fe 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* blobs */}
      <div style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", background: "#bfdbfe", filter: "blur(90px)", opacity: 0.3, top: -120, right: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "#7dd3fc", filter: "blur(80px)", opacity: 0.2, bottom: -60, left: -60, pointerEvents: "none" }} />

      <div style={{
        width: "100%", maxWidth: "440px",
        background: "#fff", borderRadius: "24px",
        padding: "40px 36px",
        border: "1px solid #dbeafe",
        boxShadow: "0 20px 60px rgba(37,99,235,0.12)",
        position: "relative", zIndex: 1,
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg, #2563eb, #38bdf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: "800", fontSize: "22px",
            margin: "0 auto 14px",
            boxShadow: "0 6px 20px rgba(37,99,235,0.3)",
            fontFamily: "'Sora', sans-serif",
          }}>{siteInitial}</div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#1e3a5f", fontFamily: "'Sora', sans-serif" }}>
            Join {siteName}
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
            Create your patient account to get started
          </p>
        </div>

       
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "22px" }}>

          {/* Full Name */}
          <div>
            <label style={labelStyle}><User size={11} /> Full Name</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#60a5fa", pointerEvents: "none" }}>
                <User size={15} />
              </span>
              <input
                type="text" placeholder="Enter your full name"
                value={name} onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                onBlur={(e) => e.target.style.borderColor = "#dbeafe"}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}><Mail size={11} /> Email Address</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#60a5fa", pointerEvents: "none" }}>
                <Mail size={15} />
              </span>
              <input
                type="email" placeholder="Enter your email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                onBlur={(e) => e.target.style.borderColor = "#dbeafe"}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}><Lock size={11} /> Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#60a5fa", pointerEvents: "none" }}>
                <Lock size={15} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: "42px" }}
                onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                onBlur={(e) => e.target.style.borderColor = "#dbeafe"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 0, display: "flex", alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}><Lock size={11} /> Confirm Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#60a5fa", pointerEvents: "none" }}>
                <Lock size={15} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingRight: "42px",
                  borderColor: confirmPassword && confirmPassword !== password ? "#fca5a5" : "#dbeafe",
                  background: confirmPassword && confirmPassword !== password ? "#fff5f5" : "#f8faff",
                }}
                onFocus={(e) => {
                  if (!(confirmPassword && confirmPassword !== password))
                    e.target.style.borderColor = "#93c5fd";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = confirmPassword && confirmPassword !== password ? "#fca5a5" : "#dbeafe";
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 0, display: "flex", alignItems: "center",
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#ef4444", fontWeight: "500" }}>
                Passwords do not match
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: "100%", padding: "13px",
            borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, #2563eb, #38bdf8)",
            color: "#fff", fontSize: "15px", fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: "0 6px 20px rgba(37,99,235,0.3)",
            fontFamily: "inherit", transition: "all 0.2s",
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading
            ? <><Loader2 size={17} style={{ animation: "spin 0.8s linear infinite" }} /> Creating Account...</>
            : <>Create Account <ArrowRight size={17} /></>
          }
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>

        {/* Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#2563eb", fontWeight: "700", textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Are you a doctor?{" "}
            <Link to="/doctor-registration/step1" style={{ color: "#2563eb", fontWeight: "700", textDecoration: "none" }}>
              Become a Doctor →
            </Link>
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      <Link to="/" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                      >
                        ← Back to Home
                      </Link>
                    </p>
        </div>
      </div>
    </div>
  );
}