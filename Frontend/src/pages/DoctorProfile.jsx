import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Calendar, Clock, MapPin, Award, Star } from "lucide-react";
import Loader from "../Componet/Loader";

export default function DoctorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/doctors/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setDoctor(res.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching doctor:", err);
        setError(
          err.response?.data?.message || "Failed to load doctor profile",
        );
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoctor();
    }
  }, [id, token]);

  const handleBookAppointment = () => {
    if (!user || user.role !== "patient") {
      navigate("/login");
      return;
    }
    navigate(`/patient/calendar/${id}`);
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Doctor Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Unable to load doctor profile"}
          </p>
          <Link
            to="/patient/browse-services"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <ArrowLeft size={20} />
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-800">Doctor Profile</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section with Image */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <img
                src={doctor.profileImage || "/default-doctor.png"}
                alt={doctor.user?.name}
                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">
                {doctor.user?.name || "Doctor"}
              </h1>
              <p className="text-2xl text-blue-100 mb-4">
                {doctor.specialization}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-blue-700">
                  <Award size={20} />
                  <span>{doctor.experience || 0} Years Experience</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-blue-700">
                  <Star size={20} />
                  <span>4.8 Rating (120 reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Fee */}
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Consultation Fee
              </h2>
                <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-600">
                  ₹{doctor.fees}
                </span>
                <span className="text-gray-600">/consultation</span>
              </div>
            </div>

            {/* About */}
            {doctor.about && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{doctor.about}</p>
              </div>
            )}

            {/* Location */}
            {doctor.location && (
              <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="text-blue-500 mt-1 flex-shrink-0"
                    size={24}
                  />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                      Location
                    </h2>
                    <p className="text-gray-700">{doctor.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Qualifications */}
            <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award size={24} className="text-blue-600" />
                Qualifications
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    MD in {doctor.specialization}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Board Certified Specialist
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    {doctor.experience}+ years of clinical experience
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Ready to Book?
                </h3>
                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock
                      size={18}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <span>30-45 min consultation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar
                      size={18}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <span>Choose your preferred time</span>
                  </div>
                    <div className="flex items-start gap-3">
                    <span className="text-lg font-bold text-blue-600">
                      ₹{doctor.fees}
                    </span>
                    <span className="text-gray-600">per session</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBookAppointment}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition mb-3"
              >
                Book Appointment
              </button>

              <p className="text-xs text-gray-500 text-center">
                Get instant confirmation after booking
              </p>
            </div>
          </div>
        </div>

        {/* Availability Section */}
        {doctor.availability && (
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={24} className="text-green-600" />
              Availability
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(doctor.availability).map(([day, times]) => {
                const hasSlots = Array.isArray(times) && times.length > 0;
                return (
                  <div
                    key={day}
                    className={`p-4 rounded-lg border-2 text-center ${
                      hasSlots
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 bg-gray-50 opacity-50"
                    }`}
                  >
                    <p className="font-bold text-gray-900 mb-2 capitalize">
                      {day}
                    </p>
                    {hasSlots ? (
                      <p className="text-sm text-green-700 font-medium">
                        {times.length} slots available
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">No slots</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
