import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Search } from "lucide-react";
import API from "../util/api";
import { showToast } from "../../Redux/toastSlice";

export default function ManageAppointments() {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await API.get("/appointments/all");
      const appointmentsList = Array.isArray(res.data) ? res.data : [];
      // keep full appointment objects so actions have access to all fields
      setAppointments(appointmentsList);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setActionLoading({ id, type: newStatus });
      // use admin route for admin UI
      await API.put(`/appointments/${id}/admin`, { status: newStatus });
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a)));
      dispatch(showToast({ message: `Appointment ${newStatus}!`, type: "success" }));
    } catch (error) {
      console.error("Update failed:", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to update appointment status";
      dispatch(showToast({ message: msg, type: "error" }));
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoading({ id, type: "delete" });
      try {
        await API.delete(`/appointments/${id}`);
      } catch (err) {
        // If delete endpoint not available, still remove locally
        console.warn("Delete API failed, removing locally:", err.message || err);
      }
      setAppointments((prev) => prev.filter((a) => a._id !== id));
      dispatch(showToast({ message: "Appointment deleted", type: "success" }));
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      const day = String(dt.getDate()).padStart(2, "0");
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const year = dt.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.log(e);
      return d; }
  };

  const filteredAppointments = appointments.filter((a) => {
    const doctor = (a.doctor?.user?.name || a.doctor?.name || "").toString().toLowerCase();
    const patient = (a.patient?.name || "").toString().toLowerCase();
    const dateStr = (a.date || "").toString();
    const timeStr = (a.time || "").toString();
    const term = search.toString().toLowerCase();
    return (
      doctor.includes(term) ||
      patient.includes(term) ||
      dateStr.includes(term) ||
      timeStr.includes(term)
    );
  });

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manage Appointments</h1>
          <p className="text-gray-600 mt-2">View and manage all doctor appointments</p>
        </div>

        {/* Search */}
        <div className="card p-4 mb-6">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 bg-white">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search by doctor, patient, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-left text-sm font-semibold border-b border-gray-200">
              <th className="px-6 py-4">Doctor</th>
              <th className="px-6 py-4">Patient</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((a) => (
                <tr
                  key={a._id}
                  className="border-b border-gray-200 hover:bg-blue-50 transition"
                >
                  <td className="px-6 py-4 font-semibold text-gray-900">{a.doctor?.user?.name || a.doctor?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-700">{a.patient?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(a.date)}</td>
                  <td className="px-6 py-4 text-gray-600">{a.time || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        (a.status || '').toString().toLowerCase() === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : (a.status || '').toString().toLowerCase() === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {(a.status || '').toString().charAt(0).toUpperCase() + (a.status || '').toString().slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    <span className="text-xl cursor-pointer" onClick={() => setSelectedAppointment(a)}>👁️</span>
                    {(a.status || '').toString().toLowerCase() !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(a._id, 'approved')}
                        disabled={actionLoading.id === a._id && actionLoading.type === 'approved'}
                        className="text-xl hover:scale-110 transition disabled:opacity-50"
                      >
                        ✅
                      </button>
                    )}
                    {(a.status || '').toString().toLowerCase() !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(a._id, 'cancelled')}
                        disabled={actionLoading.id === a._id && actionLoading.type === 'cancelled'}
                        className="text-xl hover:scale-110 transition disabled:opacity-50"
                      >
                        ❌
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(a._id)}
                      disabled={actionLoading.id === a._id && actionLoading.type === 'delete'}
                      className="text-xl hover:scale-110 transition disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No appointments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedAppointment(null)} />
            <div className="max-w-xl w-full z-10">
              <div className="overflow-hidden rounded-lg shadow-xl">
                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Appointment Details</h3>
                  <button onClick={() => setSelectedAppointment(null)} className="text-white/90 hover:text-white">Close</button>
                </div>
                <div className="bg-white p-6 text-gray-700">
                <p><strong>Doctor:</strong> {selectedAppointment.doctor?.user?.name || selectedAppointment.doctor?.name || 'N/A'}</p>
                <p className="mt-2"><strong>Patient:</strong> {selectedAppointment.patient?.name || 'N/A'}</p>
                <p className="mt-2"><strong>Date:</strong> {formatDate(selectedAppointment.date)} {selectedAppointment.time || ''}</p>
                <p className="mt-2"><strong>Status:</strong> {(selectedAppointment.status || '').toString().charAt(0).toUpperCase() + (selectedAppointment.status || '').toString().slice(1)}</p>
                {selectedAppointment.medicalReport && (
                  <div className="mt-4 border-t pt-3 text-sm text-gray-700">
                    <p className="font-medium">Diagnosis</p>
                    <p>{selectedAppointment.medicalReport.diagnosis || 'N/A'}</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
