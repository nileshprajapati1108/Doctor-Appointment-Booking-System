// src/pages/Patient/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../util/api";
import { useSelector } from "react-redux";

export default function PatientDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [activity, setActivity] = useState([]);
  const auth = JSON.parse(localStorage.getItem("auth"));
  const user = auth?.user || null;

  // Fetch appointments and compute simple stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/appointments/my");
        const appts = res.data || [];
        setUpcoming(appts.slice(0, 4));
        setActivity([]);
        setSavedDoctors([]);

        // compute stats
        const activeAppointments = appts.filter(a => a.status && a.status !== 'completed').length;
        const totalSpent = appts.reduce((s, a) => s + (a.fees || a.fee || 0), 0);
        const avgRating = appts.reduce((s, a) => s + (a.doctor?.rating || 0), 0) / (appts.length || 1);

        setStats({ activeAppointments, totalSpent, savedDoctors: 0, avgRating: avgRating.toFixed(1) });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hi, {user?.name || 'Patient'} 👋</h1>
          <p className="muted mt-1">Welcome back — here's what's happening with your health.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => navigate('/patient/browse-services')} className="btn-primary">Book a Doctor</button>
            <button onClick={() => navigate('/patient/appointments')} className="px-4 py-2 rounded-md border text-sm">My Appointments</button>
            <button onClick={() => navigate('/patient/profile')} className="px-4 py-2 rounded-md border text-sm">Edit Profile</button>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="bg-white p-4 rounded-lg shadow text-right">
            <div className="text-xs muted">Next appointment</div>
            {upcoming[0] ? (
              <div className="text-sm font-semibold text-gray-800">{upcoming[0].doctorName}</div>
            ) : (
              <div className="text-sm muted">No upcoming appointments</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs muted">Active Appointments</div>
          <div className="text-2xl font-bold mt-2">{stats?.activeAppointments ?? '—'}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs muted">Total Spent</div>
          <div className="text-2xl font-bold mt-2">₹{stats?.totalSpent ?? '—'}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs muted">Saved Doctors</div>
          <div className="text-2xl font-bold mt-2">{stats?.savedDoctors ?? '—'}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs muted">Avg Doctor Rating</div>
          <div className="text-2xl font-bold mt-2">{stats?.avgRating ?? '—'}</div>
        </div>
      </div>

      {/* Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Upcoming */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Upcoming Appointments</h3>
              <button onClick={() => navigate('/patient/appointments')} className="text-sm text-blue-600">View all</button>
            </div>

            {upcoming.length === 0 ? (
              <div className="muted text-sm">No upcoming appointments</div>
            ) : (
              upcoming.map((app, i) => (
                <div key={i} className="p-3 rounded-lg border mb-3 flex items-center justify-between hover:shadow-sm cursor-pointer" onClick={() => navigate(`/patient/appointments`)}>
                  <div>
                    <div className="font-semibold">{app.doctorName}</div>
                    <div className="text-sm muted">{app.specialty} · {app.date} {app.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">₹{app.fee}</div>
                    <div className="text-xs muted">{app.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            {activity.length === 0 ? (
              <div className="muted text-sm">No recent activity</div>
            ) : (
              <ul className="space-y-2 text-sm muted">
                {activity.map((a, i) => (
                  <li key={i}>{a.doctor} {a.action} · <span className="text-gray-400">{a.timeAgo}</span></li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Saved Doctors */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Saved Doctors</h3>
              <button onClick={() => navigate('/patient/browse-services')} className="text-sm text-blue-600">Browse</button>
            </div>

            {savedDoctors.length === 0 ? (
              <div className="muted text-sm">No saved doctors</div>
            ) : (
              <div className="space-y-3">
                {savedDoctors.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{doc.name}</div>
                      <div className="text-sm muted">{doc.specialty}</div>
                    </div>
                    <button onClick={() => navigate(`/doctor/${doc._id}`)} className="text-sm text-blue-600">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-2">Health Tips</h3>
            <p className="muted text-sm">Small tips to keep you healthy. Stay hydrated, move regularly, and sleep well.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
