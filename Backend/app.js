import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import doctorRoutes from "./routes/doctorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import doctorRegistrationRoutes from "./routes/doctorRegistrationRoutes.js";
import slotRoutes from "./routes/slotroutes.js";

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/doctors", doctorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", reportRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctor-registration", doctorRegistrationRoutes);
app.use("/api/slots", slotRoutes);

app.get("/", (req, res) => {
  res.send("API running 🚀");
});

export default app;
