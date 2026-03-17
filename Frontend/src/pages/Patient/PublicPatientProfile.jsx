import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import Loader from "../../Componet/Loader";
import API from "../util/api";

export default function PublicPatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
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
    } catch (e) {4
      console.log(e);
      return d; }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: patientData } = await API.get(`/admin/patients/${id}`);
        setPatient(patientData);

        const { data: all } = await API.get(`/appointments/all`);
        const patientAppointments = Array.isArray(all)
          ? all.filter((a) => {
              const pid = a.patient?._id || a.patient;
              return pid && pid.toString() === id.toString();
            })
          : [];
        patientAppointments.sort((x, y) => {
          try {
            return new Date(y.date + ' ' + (y.time || '') ) - new Date(x.date + ' ' + (x.time || ''));
          } catch (e) {
            console.log(e);
            return 0; }
        });
        setAppointments(patientAppointments);
        setError(null);
      } catch (err) {
        console.error("Failed to load patient profile:", err);
        setError(err?.response?.data?.message || err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <Loader />;
  if (error || !patient)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "Unable to load patient profile"}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>
      </div>
    );

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
            <h1 className="text-xl font-bold text-gray-800">Patient Profile</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{patient.name || "Patient"}</h1>
          <p className="text-2xl text-blue-100 mb-2">{patient.age ? `${patient.age} years` : ''} {patient.gender ? `| ${patient.gender}` : ''}</p>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-blue-700">
            <Calendar size={18} />
            <span>Patient</span>
          </div>
        </div>

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
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{patient.age ? `${patient.age} years` : 'N/A'}</p>
              </div>
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
              <div className="md:col-span-2">
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
