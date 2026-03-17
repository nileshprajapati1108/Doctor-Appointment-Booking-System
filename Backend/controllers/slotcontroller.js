import Slot from "../models/AppointmentSlot.js";
import { resolveAvailability } from "../services/availabilityService.js";

export const getSlots = async (req, res) => {
  const { doctorId, date } = req.params;

  let slots = await Slot.find({ doctorId, date });

  // 🧹 Self-healing: Remove malformed slots (missing startTime)
  if (slots.some(s => !s.startTime)) {
    await Slot.deleteMany({ doctorId, date, startTime: { $exists: false } });
    slots = [];
  }

  if (slots.length === 0) {
    const generated = await resolveAvailability(doctorId, date);
    slots = await Slot.insertMany(
      generated.map(s => (typeof s === "string" ? { startTime: s, doctorId, date } : { ...s, doctorId, date }))
    );
  }

  res.json(slots.filter(s => !s.isBooked));
};
