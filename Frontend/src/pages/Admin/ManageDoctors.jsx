import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Search, Eye, CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import API from "../util/api";
import { showToast } from "../../Redux/toastSlice";

export default function ManageDoctors() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/doctors");
      const doctorsList = Array.isArray(res.data) ? res.data : [];
      setDoctors(
        doctorsList.map((doc) => ({
          id: doc._id,
          name: doc.user?.name || "N/A",
          specialty: doc.specialization || "N/A",
          email: doc.user?.email || "N/A",
          status: "Approved", // From database if available
        }))
      );
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoading({ id, type: "delete" });
      await API.delete(`/admin/doctors/${id}`);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      dispatch(showToast({ message: "Doctor deleted successfully", type: "success" }));
    } catch (error) {
      console.error("Delete failed:", error);
      dispatch(showToast({ message: "Failed to delete doctor", type: "error" }));
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
      doc.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading doctors...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manage Doctors</h1>
          <p className="text-gray-600 mt-2">View and manage all registered doctors</p>
        </div>

        {/* Search Bar */}
        <div className="card p-4 mb-6">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 bg-white">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search by name, specialty, or email..."
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
              <th className="px-6 py-4">Doctor Name</th>
              <th className="px-6 py-4">Specialty</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-gray-200 hover:bg-blue-50 transition"
                >
                  <td className="px-6 py-4 font-semibold text-gray-900">{doc.name}</td>
                  <td className="px-6 py-4 text-gray-700">{doc.specialty}</td>
                  <td className="px-6 py-4 text-gray-600">{doc.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          doc.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : doc.status === "Pending"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center flex gap-2 justify-center">
                    <button onClick={() => navigate(`/doctor/${doc.id}`)} className="p-2 rounded-lg hover:bg-blue-50 transition text-blue-600 font-medium" title="View details">
                      <div size={18} >👁️</div>
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={actionLoading.id === doc.id && actionLoading.type === "delete"}
                      className="p-2 rounded-lg hover:bg-red-50 transition text-red-600 font-medium disabled:opacity-50"
                    >
                      {actionLoading.id === doc.id && actionLoading.type === "delete" ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        "🗑️"
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500 text-sm"
                >
                  No doctors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
