import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Search, Eye, XCircle, CheckCircle, Trash2, Loader2 } from "lucide-react";
import API from "../util/api";
import { showToast } from "../../Redux/toastSlice";

export default function ManagePatients() {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/patients");
      const patientsList = Array.isArray(res.data) ? res.data : [];
      setPatients(
        patientsList.map((p) => ({
          id: p._id,
          name: p.name || "N/A",
          email: p.email || "N/A",
          phone: p.phone || "N/A",
          status: "Active",
        }))
      );
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoading({ id, type: "delete" });
      await API.delete(`/admin/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      dispatch(showToast({ message: "Patient deleted successfully", type: "success" }));
    } catch (error) {
      console.error("Delete failed:", error);
      dispatch(showToast({ message: "Failed to delete patient", type: "error" }));
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading patients...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manage Patients</h1>
          <p className="text-gray-600 mt-2">View and manage all registered patients</p>
        </div>

        {/* Search */}
        <div className="card p-4 mb-6">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 bg-white">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
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
              <th className="px-6 py-4">Patient Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-200 hover:bg-blue-50 transition"
                >
                  <td className="px-6 py-4 font-semibold text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">{p.email}</td>
                  <td className="px-6 py-4 text-gray-700">{p.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          p.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center flex gap-2 justify-center">
                    <button onClick={() => navigate(`/patient/view/${p.id}`)} className="p-2 rounded-lg hover:bg-blue-50 transition text-blue-600 font-medium">
                      👁️
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={actionLoading.id === p.id && actionLoading.type === "delete"}
                      className="p-2 rounded-lg hover:bg-red-50 transition text-red-600 font-medium disabled:opacity-50"
                    >
                      {actionLoading.id === p.id && actionLoading.type === "delete" ? (
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
                  No patients found
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
