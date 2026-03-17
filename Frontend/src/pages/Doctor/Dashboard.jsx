// src/pages/DoctorDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../util/api"; // your axios instance with auth headers

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    appointmentsCount: 0,
    activePatients: 0,
    recentBookings: [],
    averageRating: "0.0",
    appointmentSuccessRate: 0,
    avgResponseTime: 24,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await API.get("/doctors/dashboard");
        // ✅ Ensure all fields have fallback values
        setDashboard({
          totalEarnings: data?.totalEarnings ?? 0,
          thisMonthEarnings: data?.thisMonthEarnings ?? 0,
          appointmentsCount: data?.appointmentsCount ?? 0,
          activePatients: data?.activePatients ?? 0,
          recentBookings: data?.recentBookings ?? [],
          averageRating: data?.averageRating ?? "0.0",
          appointmentSuccessRate: data?.appointmentSuccessRate ?? 0,
          avgResponseTime: data?.avgResponseTime ?? 24,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
        // Keep safe defaults
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading)
    return <div className="text-center muted py-8">Loading...</div>;

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dr. Dashboard 👨‍⚕️</h1>
          <p className="muted mt-1">Track your earnings, bookings, and patient feedback.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => navigate("/doctor/profile")} className="btn-primary">Edit Profile</button>
            <button onClick={() => navigate("/doctor/calendar")} className="px-4 py-2 rounded-md border text-sm">Update Availability</button>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="bg-white p-4 rounded-lg shadow text-right">
            <div className="text-xs muted">Next booking</div>
            {dashboard.recentBookings && dashboard.recentBookings[0] ? (
              <div className="text-sm font-semibold">{dashboard.recentBookings[0].patient}</div>
            ) : (
              <div className="text-sm muted">No upcoming bookings</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs muted">Total Earnings</div>
          <div className="text-2xl font-bold mt-2">₹{dashboard.totalEarnings}</div>
          <div className="text-xs text-green-600 mt-1">+12% from last month</div>
        </div>
        <div className="card p-4">
          <div className="text-xs muted">This Month</div>
          <div className="text-2xl font-bold mt-2">₹{dashboard.thisMonthEarnings}</div>
          <div className="text-xs text-green-600 mt-1">+18% from last month</div>
        </div>
        <div className="card p-4">
          <div className="text-xs muted">Active Patients</div>
          <div className="text-2xl font-bold mt-2">{dashboard.activePatients}</div>
          <div className="text-xs text-green-600 mt-1">+3 from last week</div>
        </div>
        <div className="card p-4">
          <div className="text-xs muted">Total Appointments</div>
          <div className="text-2xl font-bold mt-2">{dashboard.appointmentsCount}</div>
          <div className="text-xs text-green-600 mt-1">+5 from last month</div>
        </div>
      </div>

      {/* Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Recent Bookings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Recent Bookings</h3>
              <button onClick={() => navigate("/doctor/bookings")} className="text-sm text-blue-600">View all</button>
            </div>

            {dashboard.recentBookings && dashboard.recentBookings.length > 0 ? (
              dashboard.recentBookings.map((booking, i) => (
                <div key={i} className="p-3 rounded-lg border mb-3 flex items-center justify-between hover:shadow-sm">
                  <div>
                    <div className="font-semibold">{booking.patient || 'N/A'}</div>
                    <div className="text-sm muted">{booking.service || 'Consultation'} · {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">₹{booking.price || 0}</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{booking.status || 'pending'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="muted text-sm">No recent bookings</div>
            )}
          </div>
        </div>

        {/* Right: Performance & Quick Actions */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold mb-3">Performance</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <div className="text-sm muted">Rating</div>
                  <div className="font-semibold">{dashboard.averageRating || '0.0'} ★</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm muted">Success Rate</div>
                  <div className="font-semibold text-sm">{dashboard.appointmentSuccessRate || 0}%</div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${dashboard.appointmentSuccessRate || 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <div className="text-sm muted">Avg Response</div>
                  <div className="font-semibold">{dashboard.avgResponseTime || 24}h</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-50">📊 View Analytics</button>
              <button className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-50">💬 Messages</button>
              <button className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-50">⚙️ Settings</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
