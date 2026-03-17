import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import gen from "../assets/General Physicians.jpeg";
import dent from "../assets/Dentiist.jpeg";
import Neurologists from "../assets/Neurologists.jpeg";
import Pediatrics from "../assets/Pediatrics.jpeg";
import den from "../assets/Dermatologists.jpeg";
import Cardiologists from "../assets/Cardiologists.jpeg";

export default function HomePage() {
  const navigate = useNavigate();

  const [doctorsCount, setDoctorsCount] = useState(null);
  const [patientsCount, setPatientsCount] = useState(null);
  const [appointmentsCount, setAppointmentsCount] = useState(null);
  const [specializationCounts, setSpecializationCounts] = useState({});

  useEffect(() => {
    // Fetch aggregate public stats and doctors list
    const fetchAll = async () => {
      try {
        const [statsRes, doctorsRes] = await Promise.all([
          fetch(`/api/stats`),
          fetch(`/api/doctors`)
        ]);

        if (statsRes && statsRes.ok) {
          const s = await statsRes.json();
          setDoctorsCount(s.totalDoctors ?? null);
          setPatientsCount(s.totalPatients ?? null);
          setAppointmentsCount(s.totalAppointments ?? null);
        }

        if (doctorsRes && doctorsRes.ok) {
          const data = await doctorsRes.json();
          // derive specialization counts keyed by lowercase specialization
          const map = {};
          (data || []).forEach((d) => {
            const spec = (d.specialization || "General Physicians").toString().trim();
            const key = spec.toLowerCase();
            map[key] = (map[key] || 0) + 1;
          });
          setSpecializationCounts(map);

          // fallback doctor count if stats endpoint didn't provide it
          if (doctorsCount === null) setDoctorsCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (e) {
        console.error("Failed to fetch stats/doctors:", e);
      }
    };

    fetchAll();
  }, []);
  // 🧩 Handle Become a Doctor
  const handleDoctorClick = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "doctor" && user.token) {
      navigate("/doctor");
    } else {
      navigate("/login");
    }
  };

  // 🧩 Handle Patient Booking
  const handleBookClick = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "patient" && user.token) {
      navigate("/patient/browse-services");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">H</div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Happy Health</h1>
              <p className="text-xs muted">Care that makes you smile</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 muted text-sm">
            <Link to="/how-it-works" className="hover:text-gray-800">How it works</Link>
            <Link to="/patient/browse-services" className="hover:text-gray-800">Browse Doctors</Link>
            <button onClick={handleDoctorClick} className="hover:text-gray-800">Become a Doctor</button>
          </nav>

          <div className="flex items-center space-x-3">
            <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm">Join now</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-28 px-6 bg-gradient-to-b from-blue-50 to-white">
        <h2 className="text-6xl font-bold text-gray-900 leading-tight max-w-3xl">
          Your Health Journey Starts Here
        </h2>
        <p className="mt-6 text-gray-600 max-w-2xl text-lg">
          Book appointments with top doctors instantly. Quality healthcare made simple, accessible, and personal.
        </p>
        <div className="mt-10 flex gap-4">
          <button
            onClick={handleBookClick}
            className="btn-primary px-8 py-3 text-lg font-semibold"
          >
            Find Doctors
          </button>
          <button
            onClick={handleDoctorClick}
            className="px-8 py-3 border-2 border-gray-800 rounded-lg text-gray-800 hover:bg-gray-50 font-semibold transition"
          >
            Get Started Free
          </button>
        </div>
        
        {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          <div>
            <p className="text-3xl font-bold text-gray-900">{doctorsCount === null ? "—" : doctorsCount}</p>
            <p className="text-gray-600 mt-1">Doctors</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{patientsCount === null ? "—" : patientsCount}</p>
            <p className="text-gray-600 mt-1">Patients</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{appointmentsCount === null ? "—" : appointmentsCount}</p>
            <p className="text-gray-600 mt-1">Appointments</p>
          </div>
            <div>
            <p className="text-3xl font-bold text-blue-600">4.9</p>
            <p className="text-gray-600 mt-1">Rating</p>
          </div>
        </div>
      </section>

      {/* Explore Services Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Browse by Specialization
          </h3>
          <p className="text-center text-gray-600 mb-12">
            Find the right specialist for your healthcare needs
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(
              [
                { name: "General Physicians", img: gen },
                { name: "Dentists", img: dent },
                { name: "Dermatologists", img: den },
                { name: "Neurologists", img: Neurologists },
                { name: "Pediatricians", img: Pediatrics },
                { name: "Cardiologists", img: Cardiologists },
              ].map((s, idx) => {
                // compute count by matching specialization keys loosely
                const displayKey = s.name.toLowerCase();
                let count = 0;
                Object.entries(specializationCounts).forEach(([k, v]) => {
                  if (k.includes(displayKey.split(" ")[0])) {
                    count += v;
                  }
                });
                // show 0 when no doctors found (remove dummy fallbacks)
                return (
                  <div
                    key={idx}
                    className="card rounded-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="relative overflow-hidden h-40">
                      <img
                        src={s.img}
                        alt={s.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition"></div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-base font-semibold text-gray-800">
                        {s.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{count} doctors</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-4">
            How It Works
          </h3>
          <p className="text-center text-gray-600 mb-12">
            Book your appointment in three simple steps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 text-center hover:shadow-lg transition">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl mb-6 mx-auto">1</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">
                Search Doctor
              </h4>
              <p className="text-gray-600">
                Browse our extensive list of qualified healthcare professionals
              </p>
            </div>
            <div className="card p-8 text-center hover:shadow-lg transition">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl mb-6 mx-auto">2</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">
                Check Availability
              </h4>
              <p className="text-gray-600">
                View doctor schedules and find the perfect time slot for you
              </p>
            </div>
            <div className="card p-8 text-center hover:shadow-lg transition">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl mb-6 mx-auto">3</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">
                Book Appointment
              </h4>
              <p className="text-gray-600">
                Confirm your appointment with just a few clicks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">H</div>
            <div>
              <h4 className="text-sm font-bold text-white">Happy Health</h4>
              <p className="text-xs">Care that makes you smile</p>
            </div>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex space-x-4 text-xs">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
