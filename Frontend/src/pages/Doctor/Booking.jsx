// src/pages/Bookings.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import API from "../util/api";
import { showToast } from "../../Redux/toastSlice";
import { getSocket } from "../../utils/socket";
import {
  Calendar,
  Clock,
  Loader2,
  User,
  Mail,
  DollarSign,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

export default function Bookings() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [medicalReport, setMedicalReport] = useState({
    diagnosis: "",
    prescription: "",
    followUpDate: "",
    doctorNotes: ""
  });
  const [savingReport, setSavingReport] = useState(false);

  // FIXED: load state per button
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });

  const fetchDoctorBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await API.get("/appointments/doctor");
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorBookings();

    // 🔴 NEW: Setup Socket.io for real-time updates
    const socket = getSocket();
    
    socket.on("appointmentStatusUpdate", (data) => {
      console.log("📡 Real-time update received:", data);
      // Refresh appointments when status changes
      fetchDoctorBookings();
      dispatch(showToast({ 
        message: "Appointment status updated", 
        type: "info" 
      }));
    });

    return () => {
      socket.off("appointmentStatusUpdate");
    };
  }, [fetchDoctorBookings, dispatch]);

  const parseTime = (t) => {
    const m = t.match(/(\d{1,2}):(\d{2})(am|pm)/i);
    if (!m) return new Date(0);
    let [_, h, min, p] = m;
    h = Number(h);
    min = Number(min);
    if (p.toLowerCase() === "pm" && h !== 12) h += 12;
    if (p.toLowerCase() === "am" && h === 12) h = 0;
    return new Date(2000, 1, 1, h, min);
  };

  const handleStatusChange = async (id, newStatus, type) => {
    try {
      setActionLoading({ id, type });

      // 🩺 NEW: If completing, validate medical report
      if (newStatus === "completed") {
        const booking = bookings.find(b => b._id === id);
        if (!booking || !booking.medicalReport?.diagnosis || !booking.medicalReport?.prescription) {
          dispatch(showToast({ 
            message: "Please fill diagnosis and prescription before completing", 
            type: "warning" 
          }));
          setActionLoading({ id: null, type: null });
          return;
        }
      }

      await API.put(`/appointments/${id}`, { 
        status: newStatus,
        ...(newStatus === "completed" && { 
          medicalReport: bookings.find(b => b._id === id)?.medicalReport 
        })
      });

      await fetchDoctorBookings();
      dispatch(showToast({ message: `Appointment ${newStatus}!`, type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || "Failed to update status", type: "error" }));
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const openDetailsModal = (booking) => {
    setSelectedBooking(booking);
    setMedicalReport({
      diagnosis: booking.medicalReport?.diagnosis || "",
      prescription: booking.medicalReport?.prescription || "",
      followUpDate: booking.medicalReport?.followUpDate ? booking.medicalReport.followUpDate.split('T')[0] : "",
      doctorNotes: booking.medicalReport?.doctorNotes || ""
    });
  };

  const handleSaveReport = async () => {
    setSavingReport(true);
    try {
      // Save medical report to local state
      setBookings(prev => prev.map(b => 
        b._id === selectedBooking._id 
          ? { ...b, medicalReport } 
          : b
      ));
      dispatch(showToast({ message: "Medical report saved locally. Complete appointment to finalize.", type: "success" }));
      setSelectedBooking(null);
    } catch (err) {
      dispatch(showToast({ message: "Failed to save report", type: "error" }));
    } finally {
      setSavingReport(false);
    }
  };

  // 🕒 NEW: Check if current time >= appointment time
  const canStartConsultation = (date, time) => {
    try {
      const appointmentDateTime = new Date(`${date} ${time}`);
      const currentTime = new Date();
      return currentTime >= appointmentDateTime;
    } catch {
      return true; // If parsing fails, allow action
    }
  };

  // 🚫 NEW: Check if can mark as no-show (15 mins past appointment time)
  const canMarkNoShow = (date, time) => {
    try {
      const appointmentDateTime = new Date(`${date} ${time}`);
      const currentTime = new Date();
      const timeDiff = currentTime - appointmentDateTime;
      const fifteenMinutes = 15 * 60 * 1000;
      return timeDiff >= fifteenMinutes;
    } catch {
      return false;
    }
  };

  const grouped = bookings.reduce((acc, ap) => {
    if (!acc[ap.date]) acc[ap.date] = [];
    acc[ap.date].push(ap);
    return acc;
  }, {});

  const getStatusStyle = (status) => {
    const s = {
      pending: "bg-blue-100 text-blue-700 border-blue-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      "in-progress": "bg-indigo-100 text-indigo-700 border-indigo-200",
      completed: "bg-blue-100 text-blue-700 border-blue-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      "no-show": "bg-blue-100 text-blue-700 border-blue-200",
    };
    return s[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        <p className="mt-3 text-gray-600">Loading your appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 shadow rounded-lg text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold mt-4 mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDoctorBookings}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-2">{bookings.length} appointment{bookings.length !== 1 ? 's' : ''} found</p>
        </div>

        {Object.keys(grouped).length === 0 && (
          <div className="card p-12 text-center">
            <Calendar className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-xl">No appointments yet.</p>
          </div>
        )}

        {Object.keys(grouped)
          .sort()
          .map((date) => (
            <div key={date} className="mb-10">
              <div className="flex items-center gap-3 mb-6 card p-4">
                <Calendar className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {grouped[date]
                  .sort((a, b) => parseTime(a.time) - parseTime(b.time))
                  .map((ap) => (
                    <div
                      key={ap._id}
                      className="card p-6 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-5 h-5 text-gray-400" />
                            <p className="font-bold text-lg text-gray-900">
                              {ap.patient?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Mail className="w-4 h-4" />
                            {ap.patient?.email}
                          </div>
                        </div>

                        <span
                          className={`px-4 py-2 text-xs border rounded-full capitalize font-semibold ${getStatusStyle(
                            ap.status
                          )}`}
                        >
                          {ap.status}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span>{ap.time}</span>
                        </div>

                        <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                          <DollarSign className="w-5 h-5" />
                          ₹{ap.fees}
                        </div>

                        <button
                          onClick={() => openDetailsModal(ap)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" /> Details & Notes
                        </button>
                      </div>

                      {/* Actions */}
                      {ap.status === "pending" && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() =>
                              handleStatusChange(ap._id, "approved", "approve")
                            }
                            disabled={
                              actionLoading.id === ap._id &&
                              actionLoading.type === "approve"
                            }
                            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 transition font-medium"
                          >
                            {actionLoading.id === ap._id &&
                            actionLoading.type === "approve" ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleStatusChange(ap._id, "cancelled", "cancel")
                            }
                            disabled={
                              actionLoading.id === ap._id &&
                              actionLoading.type === "cancel"
                            }
                            className="flex-1 bg-red-100 text-red-600 py-2.5 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 disabled:opacity-50 transition font-medium"
                          >
                            {actionLoading.id === ap._id &&
                            actionLoading.type === "cancel" ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Decline
                          </button>
                        </div>
                      )}

                      {ap.status === "approved" && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleStatusChange(ap._id, "in-progress", "start")}
                            disabled={
                              !canStartConsultation(ap.date, ap.time) ||
                              (actionLoading.id === ap._id && actionLoading.type === "start")
                            }
                            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition font-medium ${
                              canStartConsultation(ap.date, ap.time)
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            title={!canStartConsultation(ap.date, ap.time) ? "Can only start at appointment time" : ""}
                          >
                            {actionLoading.id === ap._id &&
                            actionLoading.type === "start" ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            {canStartConsultation(ap.date, ap.time) ? "Start" : "Waiting for Time"}
                          </button>

                          {/* 🚫 NEW: No Show Button */}
                          {canMarkNoShow(ap.date, ap.time) && (
                            <button
                              onClick={() => handleStatusChange(ap._id, "no-show", "noshow")}
                              disabled={
                                actionLoading.id === ap._id &&
                                actionLoading.type === "noshow"
                              }
                              className="flex-1 bg-orange-100 text-orange-600 py-2.5 rounded-lg hover:bg-orange-200 flex items-center justify-center gap-2 disabled:opacity-50 transition font-medium"
                            >
                              {actionLoading.id === ap._id &&
                              actionLoading.type === "noshow" ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              No Show
                            </button>
                          )}

                          <button
                            onClick={() => handleStatusChange(ap._id, "cancelled", "cancel")}
                            disabled={
                              actionLoading.id === ap._id &&
                              actionLoading.type === "cancel"
                            }
                            className="flex-1 bg-red-100 text-red-600 py-2.5 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 disabled:opacity-50 transition font-medium"
                          >
                            {actionLoading.id === ap._id &&
                            actionLoading.type === "cancel" ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Cancel
                          </button>
                        </div>
                      )}

                      {ap.status === "in-progress" && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              // 🩺 Check if medical report is filled
                              if (!ap.medicalReport?.diagnosis || !ap.medicalReport?.prescription) {
                                dispatch(showToast({ 
                                  message: "Please fill diagnosis and prescription in Details & Notes first", 
                                  type: "warning" 
                                }));
                                return;
                              }
                              handleStatusChange(ap._id, "completed", "complete");
                            }}
                            disabled={
                              actionLoading.id === ap._id &&
                              actionLoading.type === "complete"
                            }
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition font-medium"
                          >
                            {actionLoading.id === ap._id &&
                            actionLoading.type === "complete" ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Complete
                          </button>

                          <button
                            onClick={() => handleStatusChange(ap._id, "cancelled", "cancel")}
                            disabled={
                              actionLoading.id === ap._id &&
                              actionLoading.type === "cancel"
                            }
                            className="flex-1 bg-red-100 text-red-600 py-2.5 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 disabled:opacity-50 transition font-medium"
                          >
                            {actionLoading.id === ap._id &&
                            actionLoading.type === "cancel" ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>

      {/* Medical Details & Notes Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Appointment Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Patient Medical History (Read-Only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Patient Medical History
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Blood Group:</span> <span className="font-medium">{selectedBooking.patient?.medicalHistory?.bloodGroup || "N/A"}</span></div>
                  <div><span className="text-gray-500">Allergies:</span> <span className="font-medium">{selectedBooking.patient?.medicalHistory?.allergies || "None"}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Chronic Diseases:</span> <span className="font-medium">{selectedBooking.patient?.medicalHistory?.chronicDiseases || "None"}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Current Medications:</span> <span className="font-medium">{selectedBooking.patient?.medicalHistory?.currentMedications || "None"}</span></div>
                </div>
              </div>

              {/* Doctor Notes (Editable) */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Doctor Notes & Prescription
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-lg"
                      value={medicalReport.diagnosis}
                      onChange={(e) => setMedicalReport({...medicalReport, diagnosis: e.target.value})}
                      placeholder="Primary diagnosis..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                    <textarea 
                      className="w-full p-2 border rounded-lg"
                      rows="3"
                      value={medicalReport.prescription}
                      onChange={(e) => setMedicalReport({...medicalReport, prescription: e.target.value})}
                      placeholder="Rx..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                      <input 
                        type="date" 
                        className="w-full p-2 border rounded-lg"
                        value={medicalReport.followUpDate}
                        onChange={(e) => setMedicalReport({...medicalReport, followUpDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes</label>
                    <textarea 
                      className="w-full p-2 border rounded-lg"
                      rows="2"
                      value={medicalReport.doctorNotes}
                      onChange={(e) => setMedicalReport({...medicalReport, doctorNotes: e.target.value})}
                      placeholder="Internal notes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSaveReport} disabled={savingReport} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">{savingReport ? "Saving..." : "Save Report"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
