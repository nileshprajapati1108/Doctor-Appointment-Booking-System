import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";


import doctorRoutes from "./routes/doctorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import doctorRegistrationRoutes from "./routes/doctorRegistrationRoutes.js";
import slotRoutes from "./routes/slotroutes.js";
import statsRoutes from "./routes/statsRoutes.js";

dotenv.config();

console.log("📧 ENV CHECK:", process.env.EMAIL_USER, process.env.EMAIL_PASS ? "PASS FOUND" : "NO PASS");

const app = express();
const PORT = process.env.PORT || 5000;

// 🔴 NEW: Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  }
});

// 🔴 NEW: Socket.io connection handling
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 🔴 NEW: Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true // Allow credentials (cookies)
}));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/doctors", doctorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/doctor-registration", doctorRegistrationRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/stats", statsRoutes);


// Database connection with timeout settings
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// Routes (example)
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// 🔴 UPDATED: Start server using httpServer instead of app
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔴 Socket.io enabled`);
});
