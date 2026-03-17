import React, { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function BrowseDoctors() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [allDoctors, setAllDoctors] = useState([]);
  const [filters, setFilters] = useState({
    specialty: "All Specialties",
    search: "",
  });

  const specializations = [
    "General Physicians",
    "Dentists",
    "Dermatologists",
    "Neurologists",
    "Pediatricians",
    "Cardiologists",
  ];

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const api = useMemo(() => axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  // Fetch all doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/doctors");
        console.log("Loaded doctors:", res.data);

        setAllDoctors(res.data);
      } catch (err) {
        console.log("Error loading doctors", err);
      }
    };
    fetchDoctors();
  }, [api]);

  // FIX: Correct availability logic
  const checkAvailability = (availability) => {
    if (!availability) return false;

    return Object.values(availability).some(
      (day) => Array.isArray(day) && day.length > 0
    );
  };

  // FILTER DOCTORS
  const filteredDoctors = allDoctors.filter((doc) => {
    const doctorName = doc.user?.name?.toLowerCase() || "";
    const specialization = doc.specialization?.toLowerCase() || "";
    const searchText = filters.search.toLowerCase();

    return (
      (doctorName.includes(searchText) ||
        specialization.includes(searchText)) &&
      (filters.specialty === "All Specialties" ||
        specialization === filters.specialty.toLowerCase())
    );
  });

  // PAGINATION
  const doctorsToShow = filteredDoctors.slice(0, page * 6);

  const handleLoadMore = () => setPage(page + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Doctors</h1>
          <p className="text-gray-600">Find and book appointments with qualified healthcare professionals</p>
        </div>

        {/* Search Filters */}
        <div className="card p-6 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center border border-gray-300 rounded-lg px-4 py-2.5 bg-white hover:border-gray-400 transition">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                className="w-full outline-none bg-transparent"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

                <select
              className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
              value={filters.specialty}
              onChange={(e) =>
                setFilters({ ...filters, specialty: e.target.value })
              }
            >
              <option>All Specialties</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-600">
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Doctor Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctorsToShow.map((doc) => {
            const isAvailable = checkAvailability(doc.availability);

            return (
              <div
                key={doc._id}
                className="card overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-40 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <img
                    src={doc.profileImage || "/default-doctor.png"}
                    alt={doc.user?.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {doc.user?.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium mb-4">
                    {doc.specialization}
                  </p>

                  <div className="space-y-2 mb-4 text-sm text-gray-600 
                  ">
                    <p>
                      <span className="font-medium text-gray-900">Experience:</span> {doc.experience} years
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Fee:</span> ₹{doc.fees}/consultation
                    </p>
                    <p className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {isAvailable ? '🟢 Available' : '🔴 Not Available'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/doctor/${doc._id}`)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => navigate(`/patient/calendar/${doc._id}`)}
                      className="flex-1 px-4 py-2 btn-primary text-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {doctorsToShow.length < filteredDoctors.length && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
            >
              Load More Doctors
            </button>
          </div>
        )}

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No doctors found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
