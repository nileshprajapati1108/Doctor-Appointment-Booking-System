import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { ChevronLeft, Clock, Calendar, Globe, Loader2 } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { showToast } from "../../Redux/toastSlice";

/* ---------------------------------------------------
   TIME UTILITIES
--------------------------------------------------- */
// Convert 12-hour → 24-hour for BACKEND
function convert12To24(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
  if (!match) return timeStr;

  let [_, hour, minute, mer] = match;
  hour = parseInt(hour);

  if (mer.toLowerCase() === "pm" && hour !== 12) hour += 12;
  if (mer.toLowerCase() === "am" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

// Convert a Date object to a "YYYY-MM-DD" string in local time
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ---------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------- */

export default function BookingPage() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  const api = useMemo(() => axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  /* -----------------------------------------
     LOAD DOCTOR
  ----------------------------------------- */
  useEffect(() => {
    const loadDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${id}`);
        const d = res.data;
        setDoctor(d);
      } catch (err) {
        console.log("Error loading doctor", err);
      }
    };

    loadDoctor();
  }, [id, api]);

  const handleDateSelect = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSelectedSlotId(null);
    setAvailableSlots([]);

    try {
      const { data } = await api.get(`/patients/available-slots`, {
        params: { doctorId: doctor._id, date: dateStr }
      });
      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error("Failed to fetch slots", err);
      dispatch(showToast({ message: "Could not load slots", type: "error" }));
    }
  };

  if (!doctor) return <div className="p-6">Loading...</div>;

  /* -----------------------------------------
     CALENDAR
  ----------------------------------------- */

  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;
  const dayCells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayStr = toLocalDateString(new Date());

  /* -----------------------------------------
     CONFIRM BOOKING  (FIXED)
  ----------------------------------------- */

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        doctorId: doctor._id,
        date: selectedDate,
        time: convert12To24(selectedTime),
      };
      if (selectedSlotId) {
        payload.slotId = selectedSlotId;
      }
      const res = await api.post("/appointments/book", payload);

      dispatch(showToast({ message: "Appointment booked successfully!", type: "success" }));
      navigate("/patient/appointments");
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: err.response?.data?.message || "Failed to book appointment.", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------
     UI RENDER
  ----------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* LEFT SIDEBAR */}
      <div className="hidden lg:block w-80 p-8 border-r border-gray-200 bg-white">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mb-6 w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        <h2 className="text-2xl font-bold text-gray-900">{doctor.user?.name}</h2>
        <h3 className="text-lg font-semibold text-blue-600 mt-2">{doctor.specialization}</h3>

        <div className="mt-6 space-y-3 text-gray-600">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="font-medium">{doctor.availability?.consultationDuration || 40} min consultation</span>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="font-medium">India Standard Time</span>
          </div>
        </div>

        {step >= 2 && selectedDate && (
          <div className="mt-8 card p-6 space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{new Date(selectedDate).toDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">{selectedTime}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 p-6 md:p-8">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
            <p className="text-gray-600 mb-8">Choose your preferred appointment slot</p>

            <div className="grid lg:grid-cols-3 gap-8">

              {/* CALENDAR */}
              <div className="lg:col-span-2 card p-8">
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => setCurrentMonth(new Date(year, monthIndex - 1, 1))}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    ← Prev
                  </button>
                  <h3 className="text-xl font-bold text-gray-900">{monthName} {year}</h3>
                  <button
                    onClick={() => setCurrentMonth(new Date(year, monthIndex + 1, 1))}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Next →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center font-semibold text-gray-600 py-2">{d}</div>
                  ))}

                  {dayCells.map((day, idx) => {
                    if (!day) return <div key={idx}></div>;

                    const cellDate = new Date(year, monthIndex, day);
                    const dateStr = toLocalDateString(cellDate);
                    
                    // Check if past
                    const now = new Date();
                    now.setHours(0,0,0,0);
                    const isPast = cellDate < now;

                    let available = false;
                    if (doctor && !isPast) {
                        const weekly = doctor.availability?.weekly || [];
                        const exceptions = doctor.availability?.exceptions || [];
                        
                        // Check exception (handle ISO string format from backend)
                        const exception = exceptions.find(ex => {
                            const exDate = typeof ex.date === 'string' ? ex.date.split('T')[0] : '';
                            return exDate === dateStr;
                        });

                        if (exception) {
                            available = !exception.isUnavailable;
                        } else {
                            const dayName = cellDate.toLocaleDateString("en-US", { weekday: "long" });
                            const dayRule = weekly.find(w => w.day === dayName);
                            available = dayRule ? dayRule.isActive : false;
                        }
                    }

                    const selected = selectedDate === dateStr;
                    const isToday = dateStr === todayStr;

                    return (
                      <button
                        key={idx}
                        disabled={!available}
                        onClick={() => available && handleDateSelect(dateStr)}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center font-medium transition ${
                          selected 
                            ? "bg-blue-500 text-white shadow-md" 
                              : available 
                              ? "bg-blue-50 text-gray-900 hover:bg-blue-100 border border-blue-200"
                            : "text-gray-300 cursor-not-allowed bg-gray-50"
                            } ${isToday ? "ring-2 ring-blue-400" : ""}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIME SLOTS */}
              <div className="card p-6">
                <h4 className="font-bold text-gray-900 mb-4">
                  {selectedDate ? new Date(selectedDate).toDateString() : "Pick a date first"}
                </h4>

                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                  {selectedDate && availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <div key={slot._id || slot}>
                        {selectedTime === (typeof slot === 'string' ? slot : slot.startTime) ? (
                          <div className="flex gap-2">
                            <button className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium">
                              {typeof slot === 'string' ? slot : slot.startTime}
                            </button>
                            <button
                              onClick={() => setStep(2)}
                              className="btn-primary px-4 py-2"
                            >
                              Next
                            </button>
                          </div>
                        ) : (
                            <button
                            onClick={() => {
                                setSelectedTime(typeof slot === 'string' ? slot : slot.startTime);
                                setSelectedSlotId(typeof slot === 'string' ? null : slot._id);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition font-medium"
                          >
                            {typeof slot === 'string' ? slot : slot.startTime}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No slots available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Confirm Appointment</h2>
            <p className="text-gray-600 mb-8">Review your appointment details before confirming</p>

            <div className="card p-8 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Doctor Information</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium text-gray-900">Name:</span> {doctor.user?.name}</p>
                  <p><span className="font-medium text-gray-900">Specialization:</span> {doctor.specialization}</p>
                  <p><span className="font-medium text-gray-900">Consultation Fee:</span> <span className="text-blue-600 font-bold">₹{doctor.fees}</span></p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Appointment Details</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium text-gray-900">Date:</span> {new Date(selectedDate).toDateString()}</p>
                  <p><span className="font-medium text-gray-900">Time:</span> {selectedTime}</p>
                  <p><span className="font-medium text-gray-900">Duration:</span> {doctor.availability?.consultationDuration || 40} minutes</p>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full btn-primary py-3 text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : "Confirm Booking"}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
              >
                Back to Calendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
