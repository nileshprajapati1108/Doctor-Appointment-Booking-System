// src/pages/Billing.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { showToast } from "../../Redux/toastSlice";
import {
  Loader2,
  Calendar,
} from "lucide-react";

export default function Billing() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [payments, setPayments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [amount, setAmount] = useState("");

  const isDoctor = user?.role === "doctor";
  const isAdmin = user?.role === "admin";
  const isPatient = user?.role === "patient";

  // ✅ Safe Fetch Payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin
        ? "/api/payments"
        : isPatient
        ? "/api/appointments/my"
        : "/api/payments"; // doctor sees same as admin

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ensure data is array
      const data = Array.isArray(res.data) ? res.data : [];
      setPayments(data);
    } catch (err) {
      console.error("❌ Error fetching payments:", err);
      setError("Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isPatient, token]);

  // ✅ Safe Fetch Patient's Appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await axios.get("/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setAppointments([]);
    }
  }, [token]);

  useEffect(() => {
    fetchPayments();
    if (isPatient) fetchAppointments();
  }, [fetchPayments, fetchAppointments, isPatient]);

  // ✅ Create Cash Payment
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !amount) {
      dispatch(showToast({ message: "Please select an appointment and enter amount.", type: "warning" }));
      return;
    }

    try {
      const res = await axios.post(
        "/api/payments/cash",
        { appointmentId: selectedAppointment, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(showToast({ message: res.data.message || "Payment recorded successfully!", type: "success" }));
      setSelectedAppointment("");
      setAmount("");
      fetchPayments();
    } catch (err) {
      console.error("Payment creation failed:", err);
      dispatch(showToast({ message: err.response?.data?.message || "Failed to create payment", type: "error" }));
    }
  };

  // ✅ Confirm Payment (for doctor/admin)
  const handleConfirmPayment = async (id) => {
    try {
      const res = await axios.put(
        `/api/payments/${id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(showToast({ message: res.data.message || "Payment confirmed", type: "success" }));
      fetchPayments();
    } catch (err) {
      console.error("Confirm payment error:", err);
      dispatch(showToast({ message: err.response?.data?.message || "Failed to confirm payment", type: "error" }));
    }
  };

  // ✅ Safety totals
  const safePayments = Array.isArray(payments) ? payments : [];
  const totalAmount = safePayments
    .reduce((sum, p) => sum + (p?.amount || 0), 0)
    .toFixed(2);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
        </div>
    );

  if (error)
    return <div className="text-red-600 text-center mt-10 p-6">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-2">
            {isPatient
              ? "Manage your payment records"
              : isDoctor
              ? "Track and confirm patient payments"
              : "Monitor all system transactions"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <p className="text-4xl font-bold text-blue-600 mb-2">₹{totalAmount || "0.00"}</p>
            <p className="text-gray-600 font-medium">Total Amount</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-4xl font-bold text-green-600 mb-2">{safePayments.filter((p) => p.status === "completed").length}</p>
            <p className="text-gray-600 font-medium">Completed</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-4xl font-bold text-blue-600 mb-2">{safePayments.filter((p) => p.status === "pending").length}</p>
            <p className="text-gray-600 font-medium">Pending</p>
          </div>
        </div>

        {/* Record Payment Form (Patient Only) */}
        {isPatient && (
          <form
            onSubmit={handleCreatePayment}
            className="card p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Payment</h2>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Appointment</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAppointment}
                  onChange={(e) => setSelectedAppointment(e.target.value)}
                >
                  <option value="">Choose appointment...</option>
                  {appointments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.date || "N/A"} - {a.time || "N/A"} ({a.status || "unknown"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary px-8 h-10 flex items-center"
              >
                Submit Payment
              </button>
            </div>
          </form>
        )}

        {/* Payment List */}
        <div className="space-y-4">
          {safePayments.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500 text-lg">No payment records found.</p>
            </div>
          ) : (
            safePayments.map((p) => (
              <div
                key={p._id}
                className="card p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900">₹{p.amount || "0.00"}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {p.paymentMethod || "cash"} — {p.patient?.name || "Unknown Patient"}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
                          p.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : p.status === "pending"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.status || "unknown"}
                  </span>
                </div>

                {(isDoctor || isAdmin) && p.status === "pending" && (
                  <button
                    onClick={() => handleConfirmPayment(p._id)}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Confirm Payment
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
