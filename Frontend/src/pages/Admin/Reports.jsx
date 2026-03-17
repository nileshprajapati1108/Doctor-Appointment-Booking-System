
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import API from "../util/api";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topStats, setTopStats] = useState({ totalDoctors: 0, totalPatients: 0, totalAppointments: 0 });
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  // Theme-friendly colors: blue, amber, green
  const COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        // 1) fetch top stats
        const statsRes = await API.get("/stats");
        setTopStats(statsRes.data || {});

        // 2) fetch all appointments and derive monthly counts + revenue breakdown
        const apptRes = await API.get("/appointments/all");
        const appts = Array.isArray(apptRes.data) ? apptRes.data : [];

        // persist raw appointments to localStorage
        try { localStorage.setItem("reports_appointments_raw", JSON.stringify(appts)); } catch (e) { console.log(e); }

        // Monthly appointments (months Jan-Dec)
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const monthCounts = Array.from({ length: 12 }, (_, i) => ({ month: months[i], count: 0 }));
        appts.forEach((a) => {
          const d = new Date(a.date);
          if (!isNaN(d)) {
            monthCounts[d.getMonth()].count += 1;
          }
        });
        setAppointmentsData(monthCounts);
        try { localStorage.setItem("reports_monthly_appointments", JSON.stringify(monthCounts)); } catch (e) {console.log(e);}

        // Revenue: categorize by fees (consultation vs follow-up vs other) if available
        const revenueMap = { Consultations: 0, "Follow-ups": 0, Other: 0 };
        appts.forEach((a) => {
          const fee = Number(a.fees || 0);
          // crude heuristic: fees > 500 => Consultations, 0 < fees <= 500 => Follow-ups, else Other
          if (fee > 500) revenueMap.Consultations += fee;
          else if (fee > 0) revenueMap["Follow-ups"] += fee;
          else revenueMap.Other += 0;
        });
        const revenueArr = Object.keys(revenueMap).map((k) => ({ name: k, value: revenueMap[k] }));
        setRevenueData(revenueArr);
        try { localStorage.setItem("reports_revenue_breakdown", JSON.stringify(revenueArr)); } catch (e) { console.log(e);}

        setError(null);
      } catch (err) {
        console.error("Failed to load reports:", err);
        setError(err?.response?.data?.message || err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    // try to load from localStorage first for instant UI
    try {
      const cachedMonths = localStorage.getItem("reports_monthly_appointments");
      const cachedRevenue = localStorage.getItem("reports_revenue_breakdown");
      const cachedStats = localStorage.getItem("reports_top_stats");
      if (cachedMonths) setAppointmentsData(JSON.parse(cachedMonths));
      if (cachedRevenue) setRevenueData(JSON.parse(cachedRevenue));
      if (cachedStats) setTopStats(JSON.parse(cachedStats));
    } catch (e) {
      console.log(e);
    }

    loadReports();
  }, []);

  // persist topStats when it changes
  useEffect(() => {
    try { localStorage.setItem("reports_top_stats", JSON.stringify(topStats)); } catch (e) {}
  }, [topStats]);

  if (loading) return <div className="text-center py-8">Loading reports...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">Analytics and performance metrics</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6 text-center border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-medium">Total Doctors</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{topStats.totalDoctors || 0}</h2>
          </div>
          <div className="card p-6 text-center border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 font-medium">Total Patients</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{topStats.totalPatients || 0}</h2>
          </div>
          <div className="card p-6 text-center border-l-4 border-green-500">
            <p className="text-sm text-gray-500 font-medium">Appointments</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{topStats.totalAppointments || 0}</h2>
          </div>
          <div className="card p-6 text-center border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 font-medium">Estimated Revenue</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">₹{(revenueData.reduce((s, r) => s + (r.value || 0), 0) || 0).toLocaleString()}</h2>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Bar Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointments</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentsData} margin={{ top: 10, right: 24, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  padding={{ left: 12, right: 12 }}
                  label={{ value: 'Month', position: 'insideBottom', offset: -12 }}
                />
                <YAxis
                  stroke="#6b7280"
                  width={64}
                  label={{ value: 'Appointments', angle: -90, position: 'insideLeft', offset: -10 }}
                />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Pie Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={{ fill: "#374151" }}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value || 0).toLocaleString()}`} contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
