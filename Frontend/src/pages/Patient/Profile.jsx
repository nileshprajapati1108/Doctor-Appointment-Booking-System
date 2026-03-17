import React, { useEffect, useState } from "react";
import API from "../util/api";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../Redux/authSlice";
import { showToast } from "../../Redux/toastSlice";

export default function PatientProfile() {
  const dispatch = useDispatch();
  const auth = JSON.parse(localStorage.getItem("auth")) || {};
  const user = auth.user || {};

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [medicalHistory, setMedicalHistory] = useState({
    bloodGroup: user.medicalHistory?.bloodGroup || "",
    allergies: user.medicalHistory?.allergies || "",
    chronicDiseases: user.medicalHistory?.chronicDiseases || "",
    pastSurgeries: user.medicalHistory?.pastSurgeries || "",
    currentMedications: user.medicalHistory?.currentMedications || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // try to refresh user info
    const fetchProfile = async () => {
      try {
        const { data } = await API.get("/auth/verify");
        setName(data.name || "");
        setEmail(data.email || "");
        if (data.medicalHistory) setMedicalHistory(data.medicalHistory);
      } catch (err) {
        // ignore — user may not be logged in here
        console.log(err);
        
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, email, medicalHistory };
      if (password) payload.password = password;

      const { data } = await API.put("/auth/profile", payload);

      // Update redux + localStorage with returned user + token
      dispatch(loginSuccess(data));
      dispatch(showToast({ message: "Profile updated", type: "success" }));
      setPassword("");
    } catch (err) {
      const msg = err?.response?.data?.message || "Update failed";
      dispatch(showToast({ message: msg, type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryChange = (e) => {
    setMedicalHistory({ ...medicalHistory, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h2>
          <p className="text-gray-600 mb-8">Update your personal information and password</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                required
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Leave blank to keep current password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
              />
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Medical History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={medicalHistory.bloodGroup}
                    onChange={handleHistoryChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <input
                    name="allergies"
                    value={medicalHistory.allergies}
                    onChange={handleHistoryChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g. Peanuts, Penicillin"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Diseases</label>
                  <input
                    name="chronicDiseases"
                    value={medicalHistory.chronicDiseases}
                    onChange={handleHistoryChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g. Diabetes, Hypertension"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                  <textarea
                    name="currentMedications"
                    value={medicalHistory.currentMedications}
                    onChange={handleHistoryChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    rows="2"
                    placeholder="List current medications..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
