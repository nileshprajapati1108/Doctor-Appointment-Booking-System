import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Calendar, Clock, FileText, RefreshCw } from "lucide-react";
import API from "../util/api";
import { showToast } from "../../Redux/toastSlice";
import ConfirmDialog from "../../Componet/ConfirmDialog";
import DoctorAvatar from "../../Componet/DoctorAvatar";
import { getSocket } from "../../utils/socket";

export default function MyAppointments() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("All");
  const [appointments, setAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    appointmentId: null,
    action: null, // "cancel" or "reschedule"
  });

  const loadAppointments = async () => {
    try {
      const [appointmentsRes, historyRes] = await Promise.all([
        API.get("/appointments/my"),
        API.get("/appointments/medical-history")
      ]);
      setAppointments(appointmentsRes.data || []);
      setMedicalHistory(historyRes.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await loadAppointments();
      } catch (err) {
        console.error("Failed to load appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    load();

    // 🔴 NEW: Setup Socket.io for real-time updates
    const socket = getSocket();
    
    socket.on("appointmentStatusUpdate", (data) => {
      console.log("📡 Real-time update received:", data);
      // Refresh appointments when status changes
      loadAppointments();
      dispatch(showToast({ 
        message: "Appointment status updated", 
        type: "info" 
      }));
    });

    return () => {
      socket.off("appointmentStatusUpdate");
    };
  }, [dispatch]);

  const cancelAppointment = async (id) => {
    try {
      await API.put(`/appointments/${id}/cancel`);
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
      dispatch(showToast({ message: "Appointment cancelled successfully", type: "success" }));
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to cancel appointment', type: "error" }));
    }
  };

  const rescheduleAppointment = async (id) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD)');
    const newTime = prompt('Enter new time (HH:MM, 24-hour)');
    if (!newDate || !newTime) return;
    try {
      await API.put(`/appointments/${id}/reschedule`, { date: newDate, time: newTime });
      setAppointments((prev) => prev.map(a => a._id === id ? { ...a, date: newDate, time: newTime, status: 'rescheduled' } : a));
      dispatch(showToast({ message: "Appointment rescheduled successfully", type: "success" }));
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to reschedule', type: "error" }));
    }
  };

  // 🔁 NEW: Rebook with same doctor
  const rebookAppointment = async (appointmentId, doctorId) => {
    try {
      // In a real scenario, you'd navigate to slot selection for this doctor
      dispatch(showToast({ 
        message: "Redirecting to booking page with same doctor...", 
        type: "info" 
      }));
      // Navigate to browse page with doctor pre-selected
      // For now, show a message
      alert(`Rebook feature: Please go to Browse Doctors and select Dr. ${doctorId} again`);
    } catch (err) {
      dispatch(showToast({ 
        message: "Failed to rebook", 
        type: "error" 
      }));
    }
  };

  const stats = [
    { label: "Pending", value: appointments.filter(a => a.status === 'pending').length, color: "bg-blue-100 text-blue-600" },
    { label: "Confirmed", value: appointments.filter(a => a.status === 'approved' || a.status === 'confirmed').length, color: "bg-green-100 text-green-600" },
    { label: "Completed", value: appointments.filter(a => a.status === 'completed').length, color: "bg-blue-100 text-blue-600" },
    { label: "Total Spent", value: `$${appointments.reduce((s, a) => s + (a.fees || a.fee || 0), 0)}`, color: "bg-blue-100 text-blue-700" },
  ];

  const filteredAppointments = activeTab === "All" ? appointments : (
    activeTab === 'Upcoming' ? appointments.filter(a => ['pending','approved','confirmed','rescheduled'].includes(a.status)) : appointments.filter(a => (
      activeTab === 'Pending' ? a.status === 'pending' : activeTab === 'Confirmed' ? (a.status === 'approved' || a.status === 'confirmed') : a.status === 'completed'
    ))
  );

  if (loading) return <div className="p-6 text-center">Loading appointments...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage and track all your doctor bookings in one place</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="card p-6 text-center hover:shadow-md transition">
              <p className={`text-3xl font-bold rounded-full px-3 py-1 inline-block ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-600 mt-3">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="card p-1 mb-8">
          <div className="flex gap-0 overflow-x-auto">
            {['All', 'Upcoming', 'Pending', 'Confirmed', 'Completed', 'Medical History'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 px-6 py-3 text-sm font-medium transition whitespace-nowrap ${activeTab === tab 
                  ? "bg-blue-500 text-white rounded-lg m-1" 
                  : "text-gray-600 hover:text-gray-900"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* 🩺 NEW: Medical History View */}
          {activeTab === "Medical History" && (
            <>
              {medicalHistory.length === 0 && (
                <div className="text-center card p-12">
                  <FileText className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No medical history yet</p>
                  <p className="text-sm text-gray-400 mt-2">Your completed appointments will appear here</p>
                </div>
              )}
              {medicalHistory.map((record) => (
                <div key={record._id} className="card p-6 hover:shadow-md transition">
                  <div className="flex items-start gap-4 mb-4">
                    <DoctorAvatar doctor={record.doctor} size="w-16 h-16" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {record.doctor?.user?.name || 'Doctor'}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">{record.doctor?.specialization || 'Specialist'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {record.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {record.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMedicalRecord(record)}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                  
                  {record.medicalReport && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">Diagnosis:</span>
                          <p className="text-gray-800 mt-1">{record.medicalReport.diagnosis || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Prescription:</span>
                          <p className="text-gray-800 mt-1">{record.medicalReport.prescription || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                    <button
                      onClick={() => rebookAppointment(record._id, record.doctor._id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Rebook Doctor
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Regular Appointments View */}
          {activeTab !== "Medical History" && (
            <>
              {filteredAppointments.length === 0 && (
                <div className="text-center card p-12">
                  <p className="text-gray-500 text-lg">No appointments found in this category</p>
                </div>
              )}
              {filteredAppointments.map((appt) => (
                <div key={appt._id} className="card p-6 hover:shadow-md transition">
                  <div className="flex items-start gap-4 mb-4">
                    <DoctorAvatar doctor={appt.doctor} size="w-16 h-16" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {appt.doctor?.user?.name || appt.doctor?.name || 'Doctor'}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">{appt.doctor?.specialization || appt.specialty || 'Specialist'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {appt.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {appt.time}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₹{appt.fees || appt.fee || 0}</p>
                      <span className={`text-xs font-medium px-3 py-1 mt-2 inline-block rounded-full ${
                        appt.status === 'pending' ? 'bg-blue-100 text-blue-700' 
                        : appt.status === 'approved' || appt.status === 'confirmed' ? 'bg-green-100 text-green-700' 
                        : appt.status === 'completed' ? 'bg-blue-100 text-blue-700'
                        : appt.status === 'no-show' ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                      </span>
                    </div>
                  </div>

                  {appt.notes || appt.description && (
                    <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">{appt.notes || appt.description}</p>
                  )}

                  {/* 🔁 NEW: Rebook button for completed appointments */}
                  {appt.status === 'completed' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => rebookAppointment(appt._id, appt.doctor._id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Rebook Same Doctor
                      </button>
                    </div>
                  )}

                  {appt.status !== 'completed' && appt.status !== 'cancelled' && appt.status !== 'no-show' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setConfirmDialog({ isOpen: true, appointmentId: appt._id, action: 'reschedule' })} 
                    className="px-4 py-2 text-sm font-medium border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    Reschedule
                  </button>
                  <button 
                    onClick={() => setConfirmDialog({ isOpen: true, appointmentId: appt._id, action: 'cancel' })} 
                    className="px-4 py-2 text-sm font-medium border border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
            </>
          )}
        </div>
      </div>

      {/* 🩺 NEW: Medical Record Details Modal */}
      {selectedMedicalRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Medical Record</h3>
              <button onClick={() => setSelectedMedicalRecord(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Appointment Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">Appointment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Doctor:</span> <span className="font-medium">{selectedMedicalRecord.doctor?.user?.name}</span></div>
                  <div><span className="text-gray-500">Specialization:</span> <span className="font-medium">{selectedMedicalRecord.doctor?.specialization}</span></div>
                  <div><span className="text-gray-500">Date:</span> <span className="font-medium">{selectedMedicalRecord.date}</span></div>
                  <div><span className="text-gray-500">Time:</span> <span className="font-medium">{selectedMedicalRecord.time}</span></div>
                </div>
              </div>

              {/* Medical Report */}
              {selectedMedicalRecord.medicalReport && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Medical Report
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                      <p className="text-gray-900">{selectedMedicalRecord.medicalReport.diagnosis || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMedicalRecord.medicalReport.prescription || 'N/A'}</p>
                    </div>
                    {selectedMedicalRecord.medicalReport.doctorNotes && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Notes</label>
                        <p className="text-gray-900">{selectedMedicalRecord.medicalReport.doctorNotes}</p>
                      </div>
                    )}
                    {selectedMedicalRecord.medicalReport.followUpDate && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                        <p className="text-gray-900">{new Date(selectedMedicalRecord.medicalReport.followUpDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedMedicalRecord(null)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === 'cancel' ? "Cancel Appointment" : "Reschedule Appointment"}
        message={
          confirmDialog.action === 'cancel'
            ? "Are you sure you want to cancel this appointment? This action cannot be undone."
            : "Are you sure you want to reschedule this appointment?"
        }
        confirmText={confirmDialog.action === 'cancel' ? "Cancel Appointment" : "Reschedule"}
        cancelText="Keep it"
        isDangerous={confirmDialog.action === 'cancel'}
        onConfirm={() => {
          if (confirmDialog.action === 'cancel') {
            cancelAppointment(confirmDialog.appointmentId);
          } else {
            rescheduleAppointment(confirmDialog.appointmentId);
          }
          setConfirmDialog({ isOpen: false, appointmentId: null, action: null });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, appointmentId: null, action: null })}
      />
    </div>
  );
}
