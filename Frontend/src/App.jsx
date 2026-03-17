// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import API from "./pages/util/api";
import { loginSuccess } from "./Redux/authSlice";
import ProtectedRoute from "./Components/ProtectedRoute";
import ToastContainer from "./Componet/ToastContainer";
import { initializeSocket, disconnectSocket } from "./utils/socket";

import Home from "./pages/Home";
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import DoctorRegistrationStep1 from './pages/Auth/DoctorRegistrationStep1';
import DoctorRegistrationStep2 from './pages/Auth/DoctorRegistrationStep2';
import DoctorRegistrationConfirmation from './pages/Auth/DoctorRegistrationConfirmation';
import ResetPassword from './pages/Auth/ResetPassword';
import HowItWorks from './pages/HowItWorks';
import PublicDoctorProfile from './pages/DoctorProfile';
import PublicPatientProfile from './pages/Patient/PublicPatientProfile';

// Doctor imports
import DoctorLayout from "./Layouts/DoctorLayout";
import DoctorDashboard from "./pages/Doctor/Dashboard";
import DoctorProfile from "./pages/Doctor/Profile";
import Billing from "./pages/Doctor/Billing";
import DoctorCalendar from "./pages/Doctor/Calendar";
import DoctorBooking from "./pages/Doctor/Booking";


// Patient imports
import PatientLayout from "./Layouts/PatientLayout";
import PatientDashboard from "./pages/Patient/Dashboard";
import BrowseServices from "./pages/Patient/Browse";
import MyBookings from "./pages/Patient/Booking";
import PatientCalendar from "./pages/Patient/Calender";
import PatientProfile from "./pages/Patient/Profile";

 // Admin imports
 import AdminLayout from "./Layouts/AdminLayout";
 import AdminDashboard from "./pages/Admin/Dashboard";
 import ManageDoctors from "./pages/Admin/ManageDoctors";
 import ManagePatients from "./pages/Admin/ManagePatients";
 import PatientDetails from "./pages/Admin/PatientDetails";
 import ManageAppointments from "./pages/Admin/ManageAppointments";
 import DoctorApproval from "./pages/Admin/DoctorApproval";
 import Reports from "./pages/Admin/Reports";
 import Settings from "./pages/Admin/Seting";
 import Payments from "./pages/Admin/Payments";

function App() {
  const dispatch = useDispatch();

  // Check if user is authenticated on app load (from cookie)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await API.get("/auth/verify");
        dispatch(loginSuccess(data));
      } catch (error) {
        console.log("Not authenticated:", error.message);
      }
    };
    checkAuth();

    // 🔴 NEW: Initialize Socket.io connection
    initializeSocket();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/doctor-registration/step1" element={<DoctorRegistrationStep1 />} />
        <Route path="/doctor-registration/step2" element={<DoctorRegistrationStep2 />} />
        <Route path="/doctor-registration/confirmation" element={<DoctorRegistrationConfirmation />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/doctor/:id" element={<PublicDoctorProfile />} />
        <Route path="/patient/view/:id" element={<PublicPatientProfile />} />
        {/* Doctor side */}
        <Route path="/doctor" element={<ProtectedRoute requiredRole="doctor"><DoctorLayout /></ProtectedRoute>}>
          <Route index element={<DoctorDashboard />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="calendar" element={<DoctorCalendar />} />
          <Route path="bookings" element={<DoctorBooking />} />
          <Route path="billing" element={<Billing />} />
        </Route>

        {/* Patient side */}
        <Route path="/patient" element={<ProtectedRoute requiredRole="patient"><PatientLayout /></ProtectedRoute>}>
          <Route index element={<PatientDashboard />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="browse-services" element={<BrowseServices />} />
          <Route path="appointments" element={<MyBookings />} />
          <Route path="calendar/:id" element={<PatientCalendar />} />
        </Route>

        {/* Admin side */}
         <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="doctors" element={<ManageDoctors />} />
          <Route path="doctor-approval" element={<DoctorApproval />} />
          <Route path="patients" element={<ManagePatients />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="appointments" element={<ManageAppointments />} />
          <Route path="report" element={<Reports />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
