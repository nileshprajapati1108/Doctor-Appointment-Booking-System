import Weekly from "../models/DoctorWeeklyAvailability.js";
import Exception from "../models/DoctorAvailabilityException.js";
import { generateSlots } from "./slotGenerator.js";

export const resolveAvailability = async (doctorId, date) => {
  const day = new Date(date).getDay();

  const exception = await Exception.findOne({ doctorId, date });
  if (exception) {
    if (exception.isUnavailable) return [];
    return generateSlots(exception);
  }

  const weekly = await Weekly.findOne({ doctorId, dayOfWeek: day });
  if (!weekly) return [];

  return generateSlots(weekly);
};
