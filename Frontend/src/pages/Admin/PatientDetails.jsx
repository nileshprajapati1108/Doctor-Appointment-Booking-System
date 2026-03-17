import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, MapPin, Calendar } from "lucide-react";
import API from "../../pages/util/api";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  // derived stats
  const totalVisits = appointments.length;
  const upcomingCount = appointments.filter((a) => {
    try {
      const apptDate = new Date(`${a.date} ${a.time}`);
      return apptDate > new Date() && a.status !== "cancelled";
    } catch (e) {
      console.log(e);
      
      return false;
    }
  }).length;
  const memberSince = patient?.createdAt ? new Date(patient.createdAt).toLocaleString("default", { month: "short", year: "numeric" }) : "-";
  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      const day = String(dt.getDate()).padStart(2, "0");
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const year = dt.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) { return d; }
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/admin/patients/${id}`);
        setPatient(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch patient:", error);
        // Surface backend message when available
        if (error?.response) {
          console.error("Response data:", error.response.data);
          setError(error.response.data?.message || JSON.stringify(error.response.data));
          if (error.response.status === 401) {
            // Not authenticated — redirect to login
            navigate('/login');
            return;
          }
        } else {
          setError(error.message || 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };
    const fetchAppointments = async () => {
      try {
        // Admin-only endpoint that returns all appointments — we'll filter for this patient
        const { data: all } = await API.get(`/appointments/all`);
        const patientAppointments = Array.isArray(all)
          ? all.filter((a) => {
              // appointment.patient may be an object or id
              const pid = a.patient?._id || a.patient;
              return pid && pid.toString() === id.toString();
            })
          : [];
        // sort by date desc
        patientAppointments.sort((x, y) => {
          try {
            return new Date(y.date + ' ' + (y.time || '') ) - new Date(x.date + ' ' + (x.time || ''));
          } catch (e) { return 0; }
        });
        setAppointments(patientAppointments);
      } catch (e) {
        console.error("Failed to fetch appointments:", e);
      }
    };

    fetchPatient();
    fetchAppointments();
  }, [id]);

  if (loading) return <div className="py-20 text-center text-gray-500">Loading patient... <Loader2 className="inline-block w-4 h-4 animate-spin ml-2" /></div>;

  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;

  if (!patient) return <div className="py-20 text-center text-gray-500">Patient not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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
            <h1 className="text-xl font-bold text-gray-800">Patient Details</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{patient.name || "Patient"}</h1>
          <p className="text-2xl text-blue-100 mb-2">{patient.age ? `${patient.age} years` : ''} {patient.gender ? `| ${patient.gender}` : ''}</p>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-blue-700">
            <Calendar size={18} />
            <span>Patient</span>
          </div>
        </div>

        {/* Summary row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">{memberSince}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">Visits / Upcoming</p>
              <p className="font-medium">{totalVisits} / {upcomingCount}</p>
            </div>
          </div>

        <div className="space-y-6">
          <section className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{patient.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{patient.mobileNumber || patient.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{patient.residentialAddress || 'N/A'}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="font-medium">{patient.medicalHistory?.bloodGroup || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Allergies</p>
                <p className="font-medium">{patient.medicalHistory?.allergies || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Chronic Diseases</p>
                <p className="font-medium">{patient.medicalHistory?.chronicDiseases || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Medications</p>
                <p className="font-medium">{patient.medicalHistory?.currentMedications || 'N/A'}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointments</h2>
            <div className="space-y-3">
              {appointments.length === 0 && <p className="text-gray-500">No appointments</p>}
                {appointments.map((a) => (
                <div key={a._id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold">Dr. {a.doctor?.user?.name || a.doctor?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{a.doctor?.specialization || ''}</p>
                      <p className="text-sm text-gray-600">Patient: {a.patient?.name || patient?.name || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDate(a.date)} • {a.time}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                        a.status === 'completed' ? 'bg-green-100 text-green-700' : a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{(a.status || '').toString().charAt(0).toUpperCase() + (a.status || '').toString().slice(1)}</span>
                    </div>
                  </div>
                  {a.medicalReport && (
                    <div className="mt-3 text-sm text-gray-700 border-t pt-3">
                      <p className="font-medium">Diagnosis</p>
                      <p>{a.medicalReport.diagnosis || 'N/A'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
