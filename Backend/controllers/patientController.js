import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { generateSlots } from "./doctorController.js";
import Slot from "../models/AppointmentSlot.js";

// @desc   Get all approved doctors (browse/search)
export const getAllDoctors = async (req, res) => {
  try {
    const { specialization, location } = req.query;

    let query = { isApproved: true };
    if (specialization) query.specialization = specialization;
    if (location) query.location = location;

    const doctors = await Doctor.find(query).populate("user", "name email");
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc   Get doctor details
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("user", "name email");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc   Get available slots for a doctor on a specific date
export const getDoctorAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
        return res.status(400).json({ message: "Doctor ID and Date are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // 1. Try to find existing slots in DB
    let dbSlots = await Slot.find({ doctorId, date });

    // 🧹 Self-healing: Remove malformed slots
    if (dbSlots.some(s => !s.startTime)) {
        await Slot.deleteMany({ doctorId, date, startTime: { $exists: false } });
        dbSlots = [];
    }

    // 2. If no slots exist, generate and save them
    if (dbSlots.length === 0) {
        const appointments = await Appointment.find({
            doctor: doctorId,
            date: date,
            status: { $nin: ['cancelled', 'rejected'] }
        }).select('time status');

        const timeStrings = generateSlots(doctor.availability || {}, date, appointments);

        const newSlots = timeStrings.map(time => ({
            doctorId,
            date,
            startTime: time,
            isBooked: false
        }));

        if (newSlots.length > 0) {
            dbSlots = await Slot.insertMany(newSlots);
        }
    }

    // 3. Return only available slots
    let availableSlots = dbSlots.filter(s => !s.isBooked);

    // Filter out past slots
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (date < todayStr) {
        availableSlots = [];
    } else if (date === todayStr) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        availableSlots = availableSlots.filter(slot => {
            const [h, m] = slot.startTime.split(':').map(Number);
            return (h * 60 + m) > currentMinutes;
        });
    }

    res.json({ date, slots: availableSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc   Get logged-in patient’s appointments
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate("doctor", "specialization location fees")
      .populate("patient", "name email");
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
