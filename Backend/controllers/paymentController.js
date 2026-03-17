import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";

// 📌 Create Cash Payment Record
export const createCashPayment = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;
    const patientId = req.user.id;

    // Verify appointment exists
    const appointment = await Appointment.findById(appointmentId).populate("doctor");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const payment = await Payment.create({
      appointment: appointment._id,
      patient: patientId,
      doctor: appointment.doctor._id,
      amount,
      paymentMethod: "cash",
      status: "pending", // marked pending until admin/doctor confirms
    });

    res.status(201).json({
      message: "Cash payment recorded. Please pay at the clinic.",
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Confirm Cash Payment (Admin/Doctor marks as completed)
export const confirmCashPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "completed";
    await payment.save();

    res.status(200).json({ message: "Cash payment confirmed", payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get All Payments (Admin use)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("patient", "name email")
      .populate("doctor", "name email")
      .populate("appointment");
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPayments = async (req, res) => {
  const payments = await Payment.find({ patient: req.user.id })
    .populate("doctor", "name email")
    .populate("appointment");
  res.json(payments);
};
