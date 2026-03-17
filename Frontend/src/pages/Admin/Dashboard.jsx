import { useEffect, useState } from "react";
import {
  CalendarDays,
  Stethoscope,
  Users,
  FileBarChart,
} from "lucide-react";
import API from "../util/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    appointmentsToday: 0,
    monthlyRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], counts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const doctorsRes = await API.get("/admin/doctors");
      const patientsRes = await API.get("/admin/patients");
      const appointmentsRes = await API.get("/appointments/all");

      const doctors = Array.isArray(doctorsRes.data) ? doctorsRes.data.length : 0;
      const patients = Array.isArray(patientsRes.data) ? patientsRes.data.length : 0;
      const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];

      const today = new Date().toISOString().split("T")[0];
      const normalizeForCompare = (d) => {
        if (!d) return null;
        if (typeof d === "string" && d.includes("-")) return new Date(d).toISOString().split("T")[0];
        if (typeof d === "string" && d.includes("/")) {
          const parts = d.split("/").map((p) => p.trim());
          if (parts.length === 3) {
            const day = parts[0].padStart(2, "0");
            const month = parts[1].padStart(2, "0");
            const year = parts[2].padStart(4, "0");
            return `${year}-${month}-${day}`;
          }
        }
        try {
          return new Date(d).toISOString().split("T")[0];
        } catch (e) {
          console.log(e);
          return null;
        }
      };

      const appointmentsToday = appointments.filter((a) => normalizeForCompare(a.date) === today).length;

      const revenue = appointments.reduce((sum, a) => sum + (a.fees || 0), 0);

      // Recent activity: combine recent doctors and recent appointments
      const recentDocs = Array.isArray(doctorsRes.data) ? doctorsRes.data : [];
      const recentAppts = Array.isArray(appointments) ? appointments : [];

      const activities = [];
      recentDocs
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .forEach((d) => {
          activities.push({
            type: "doctor",
            date: d.createdAt,
            text: `New doctor ${d.user?.name || "(unknown)"} added`,
          });
        });

      recentAppts.slice(0, 10).forEach((a) => {
        const apptDate = a.date || "";
        const apptTime = a.time || "";
        activities.push({
          type: "appointment",
          date: new Date(`${apptDate} ${apptTime}`),
          text: `Appointment booked by ${a.patient?.name || "(patient)"} with Dr. ${a.doctor?.user?.name || "(doctor)"}`,
        });
      });

      // Sort activities by date desc and keep top 5
      activities.sort((x, y) => new Date(y.date) - new Date(x.date));
      const topActivities = activities.slice(0, 5);

      // Chart: appointments per day for last 7 days
      const labels = [];
      const counts = [];
      for (let i = 6; i >= 0; i--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const key = dt.toISOString().split("T")[0];
        labels.push(key);
        // Normalize appointment date strings to ISO (YYYY-MM-DD) for reliable matching
        const normalize = (d) => {
          if (!d) return null;
          // If already ISO-like
          if (typeof d === "string" && d.includes("-")) {
            return new Date(d).toISOString().split("T")[0];
          }
          // If format uses slashes like DD/MM/YYYY or D/M/YYYY
          if (typeof d === "string" && d.includes("/")) {
            const parts = d.split("/").map((p) => p.trim());
            if (parts.length === 3) {
              const day = parts[0].padStart(2, "0");
              const month = parts[1].padStart(2, "0");
              const year = parts[2].padStart(4, "0");
              return `${year}-${month}-${day}`;
            }
          }
          // Fallback: try Date parsing
          try {
            return new Date(d).toISOString().split("T")[0];
          } catch (e) {
            console.log(e);
            return null;
          }
        };

        const c = recentAppts.filter((a) => {
          const aDate = normalize(a.date);
          return aDate === key;
        }).length;
        counts.push(c);
      }

      setRecentActivity(topActivities);
      setChartData({ labels, counts });

      setStats({
        totalDoctors: doctors,
        totalPatients: patients,
        appointmentsToday: appointmentsToday,
        monthlyRevenue: revenue,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8 sticky top-0 bg-gradient-to-br from-gray-50 to-white z-30">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Stethoscope className="text-blue-600" size={28} />}
            title="Total Doctors"
            value={stats.totalDoctors}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<Users className="text-green-600" size={28} />}
            title="Total Patients"
            value={stats.totalPatients}
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<CalendarDays className="text-purple-600" size={28} />}
            title="Today's Appointments"
            value={stats.appointmentsToday}
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={<FileBarChart className="text-blue-600" size={28} />}
            title="Total Revenue"
            value={`₹${stats.monthlyRevenue.toLocaleString()}`}
            bgColor="bg-blue-50"
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Placeholder Chart */}
          <div className="card p-8 col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Appointment Trends
            </h2>
            <div className="h-64 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              {Array.isArray(chartData.counts) && chartData.counts.length > 0 && chartData.counts.reduce((s, v) => s + v, 0) > 0 ? (
                (() => {
                  const counts = chartData.counts;
                  const labels = chartData.labels;
                  const n = counts.length;
                  const vbWidth = Math.max(300, n * 60);
                  const vbHeight = 180;
                  const max = Math.max(...counts, 1);
                  const barW = Math.min(40, Math.floor(vbWidth / (n * 1.6)));
                  const gap = Math.max(8, Math.floor((vbWidth - n * barW) / (n + 1)));

                  return (
                    <svg width="100%" viewBox={`0 0 ${vbWidth} ${vbHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full">
                      {/* grid lines */}
                      <g stroke="#e6e6e6" strokeWidth="1">
                        <line x1="0" y1={20} x2={vbWidth} y2={20} />
                        <line x1="0" y1={60} x2={vbWidth} y2={60} />
                        <line x1="0" y1={100} x2={vbWidth} y2={100} />
                        <line x1="0" y1={140} x2={vbWidth} y2={140} />
                      </g>

                      {/* bars */}
                      {counts.map((c, i) => {
                        const x = gap + i * (barW + gap);
                        let h = Math.round((c / max) * (vbHeight - 60));
                        if (c > 0 && h < 8) h = 8;
                        const y = vbHeight - h - 30;
                        return (
                          <g key={i}>
                            <rect x={x} y={y} width={barW} height={h} rx="4" fill="#2563EB" />
                            <text x={x + barW / 2} y={vbHeight - 8} fontSize="10" fill="#6B7280" textAnchor="middle">{new Date(labels[i]).toLocaleDateString()}</text>
                            <title>{`${labels[i]}: ${c} appointments`}</title>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()
              ) : (
                <div className="w-full text-center text-gray-400">No appointment data</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <ul className="space-y-4 text-sm text-gray-600">
              {recentActivity.length === 0 && (
                <li className="text-gray-400">No recent activity</li>
              )}
              {recentActivity.map((act, idx) => (
                <li key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-200">
                  <span className="text-xl">{act.type === "doctor" ? "✅" : "📅"}</span>
                  <div>
                    <div className="text-sm text-gray-800">{act.text}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(act.date).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, bgColor }) {
  return (
    <div className="card p-6 flex items-center gap-4 hover:shadow-md transition">
      <div className={`p-4 rounded-lg ${bgColor}`}>{icon}</div>
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
