import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Calendar, CheckCircle2, Clock3, FileText, Loader2,
  Stethoscope, XCircle, ChevronRight, Plus, Trash2,
  User, Mail, Star, ClipboardList, Pill, FlaskConical,
  MessageSquare, AlertTriangle, Activity
} from "lucide-react";
import API from "../util/api";
import { showToast } from "../../Redux/toastSlice";
import { getSocket } from "../../utils/socket";
import ConfirmDialog from "../../Componet/ConfirmDialog";

/* ─── Style injection ─────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --azure: #1a6bff;
    --azure-mid: #4d8dff;
    --azure-pale: #e8f0ff;
    --azure-deep: #0a3d99;
    --ice: #f0f6ff;
    --slate: #1e2d4a;
    --mist: #6b7fa8;
    --line: #dde7f5;
    --white: #ffffff;
    --success: #0e9f6e;
    --warn: #f59e0b;
    --danger: #ef4444;
    --indigo: #6366f1;
  }

  .db-root * { box-sizing: border-box; }
  .db-root { font-family: 'DM Sans', sans-serif; background: var(--ice); min-height: 100vh; }

  /* ── Skeleton ── */
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, #e2eaf5 25%, #f0f5ff 50%, #e2eaf5 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 8px;
  }

  /* ── Cards ── */
  .appt-card {
    background: var(--white);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(26,107,255,.06);
    transition: box-shadow .2s, transform .2s;
  }
  .appt-card:hover { box-shadow: 0 6px 24px rgba(26,107,255,.13); transform: translateY(-2px); }

  /* ── Status pills ── */
  .pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 13px; border-radius: 999px; font-size: 13px; font-weight: 600;
    letter-spacing: .03em; text-transform: capitalize; white-space: nowrap;
  }
  .pill-pending  { background: #fff7e0; color: #b45309; border: 1px solid #fcd34d; }
  .pill-approved { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
  .pill-arrived  { background: #cffafe; color: #0e7490; border: 1px solid #67e8f9; }
  .pill-started  { background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; }
  .pill-completed{ background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
  .pill-cancelled,.pill-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .pill-noshow   { background: #ffedd5; color: #9a3412; border: 1px solid #fdba74; }

  /* ── Timeline ── */
  .timeline { display: flex; align-items: center; gap: 4px; margin-top: 14px; overflow-x: auto; padding-bottom: 2px; }
  .tl-step {
    display: flex; align-items: center; gap: 4px;
  }
  .tl-node {
    font-size: 12px; padding: 4px 11px; border-radius: 999px; white-space: nowrap;
    font-weight: 500; letter-spacing: .02em;
  }
  .tl-node.active  { background: var(--azure); color: #fff; }
  .tl-node.inactive{ background: #eaf0fa; color: var(--mist); }
  .tl-arrow { color: #c5d3ea; font-size: 10px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 11px 20px; border-radius: 10px; font-size: 15px; font-weight: 600;
    cursor: pointer; border: none; transition: all .18s; white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
  }
  .btn:disabled { opacity: .55; cursor: not-allowed; }
  .btn-primary   { background: var(--azure); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: var(--azure-deep); }
  .btn-danger    { background: #fee2e2; color: var(--danger); }
  .btn-danger:hover:not(:disabled) { background: #fecaca; }
  .btn-warn      { background: #fff3e0; color: #c2410c; }
  .btn-warn:hover:not(:disabled) { background: #ffe4c4; }
  .btn-indigo    { background: var(--indigo); color: #fff; }
  .btn-indigo:hover:not(:disabled) { background: #4f46e5; }
  .btn-success   { background: var(--success); color: #fff; }
  .btn-success:hover:not(:disabled) { background: #047857; }
  .btn-ghost     { background: transparent; color: var(--azure); border: 1px solid var(--line); }
  .btn-ghost:hover { background: var(--azure-pale); }
  .btn-clinical  {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 14px; font-weight: 600; color: var(--azure);
    background: var(--azure-pale); border: none; border-radius: 8px;
    padding: 7px 13px; cursor: pointer; transition: background .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-clinical:hover { background: #d0e2ff; }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(10,40,100,.22);
    backdrop-filter: blur(6px); z-index: 50;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .modal {
    width: 100%; max-width: 880px; background: var(--white);
    border-radius: 20px; box-shadow: 0 24px 64px rgba(10,40,100,.18);
    max-height: 92vh; overflow: hidden; display: flex; flex-direction: column;
  }
  .modal-header {
    padding: 20px 24px; border-bottom: 1px solid var(--line);
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(135deg, var(--azure-deep) 0%, var(--azure) 100%);
    border-radius: 20px 20px 0 0;
  }
  .modal-header h2 { color: #fff; font-family: 'DM Serif Display', serif; font-size: 23px; font-weight: 400; display: flex; align-items: center; gap: 8px; }
  .modal-close { background: rgba(255,255,255,.18); border: none; border-radius: 8px; padding: 6px; cursor: pointer; color: #fff; display: flex; transition: background .15s; }
  .modal-close:hover { background: rgba(255,255,255,.32); }
  .modal-body { overflow-y: auto; padding: 24px; flex: 1; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 10px; background: #fafcff; border-radius: 0 0 20px 20px; }

  /* ── Form elements ── */
  .field-label { font-size: 13px; font-weight: 600; color: var(--mist); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px; }
  .field {
    width: 100%; border: 1.5px solid var(--line); border-radius: 10px;
    padding: 13px 15px; font-size: 15px; font-family: 'DM Sans', sans-serif;
    color: var(--slate); background: var(--white); outline: none;
    transition: border-color .18s, box-shadow .18s; resize: vertical;
  }
  .field:focus { border-color: var(--azure); box-shadow: 0 0 0 3px rgba(26,107,255,.12); }
  .field::placeholder { color: #adbcda; }

  /* ── Med card ── */
  .med-card {
    border: 1.5px solid var(--line); border-radius: 12px; padding: 14px;
    background: linear-gradient(135deg, #f7faff, #eef4ff);
    position: relative;
  }

  /* ── Section divider ── */
  .section-head {
    display: flex; align-items: center; gap: 8px;
    font-family: 'DM Serif Display', serif; font-size: 20px; font-weight: 400;
    color: var(--slate); margin-bottom: 14px;
  }
  .section-head svg { color: var(--azure); }

  /* ── Date header ── */
  .date-header {
    display: flex; align-items: center; gap: 8px;
    color: var(--azure-deep); font-weight: 600; font-size: 15px;
    text-transform: uppercase; letter-spacing: .08em; margin-bottom: 14px;
  }

  /* ── Page header ── */
  .page-header {
    background: linear-gradient(135deg, var(--azure-deep) 0%, #1a6bff 60%, #4d8dff 100%);
    border-radius: 20px; padding: 28px 32px; margin-bottom: 28px;
    position: relative; overflow: hidden;
  }
  .page-header::before {
    content: ''; position: absolute; right: -40px; top: -40px;
    width: 200px; height: 200px; border-radius: 50%;
    background: rgba(255,255,255,.07);
  }
  .page-header::after {
    content: ''; position: absolute; right: 60px; bottom: -60px;
    width: 140px; height: 140px; border-radius: 50%;
    background: rgba(255,255,255,.05);
  }
  .page-header h1 {
    font-family: 'DM Serif Display', serif; font-size: 34px; font-weight: 400;
    color: #fff; margin: 0 0 8px;
  }
  .page-header p { color: rgba(255,255,255,.75); font-size: 15px; margin: 0; }

  /* ── Review badge ── */
  .review-badge {
    display: flex; align-items: center; gap: 5px; margin-top: 10px;
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
    padding: 6px 12px; font-size: 13px; color: #92400e;
  }

  /* ── Completed badge ── */
  .completed-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px;
    background: #d1fae5; color: #065f46; border-radius: 10px; font-size: 14px; font-weight: 600;
  }

  /* ── Empty state ── */
  .empty-state {
    background: var(--white); border: 1.5px dashed var(--line); border-radius: 20px;
    padding: 56px 24px; text-align: center; margin-top: 8px;
  }
  .empty-icon { width: 56px; height: 56px; background: var(--azure-pale); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }

  /* ── Tab switcher in modal ── */
  .tab-bar { display: flex; gap: 4px; background: var(--azure-pale); border-radius: 10px; padding: 4px; margin-bottom: 18px; }
  .tab-btn {
    flex: 1; padding: 10px 14px; border: none; border-radius: 7px; font-size: 15px; font-weight: 500;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .18s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .tab-btn.active { background: var(--white); color: var(--azure); box-shadow: 0 2px 8px rgba(26,107,255,.12); font-weight: 600; }
  .tab-btn.inactive { background: transparent; color: var(--mist); }

  /* ── Grid ── */
  .appt-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .modal-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
  @media (min-width: 700px) { .modal-grid { grid-template-columns: 1fr 1fr; } }
`;

/* ─── Constants ──────────────────────────────────────────── */
const FLOW = ["pending", "approved", "arrived", "consultation-started", "consultation-completed"];
const emptyMedicine = () => ({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });
const emptyNotes = { symptomsObserved: "", clinicalObservations: "", suggestedTests: "", internalRemarks: "" };

/* ─── Skeleton loader ────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="appt-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 180, height: 12 }} />
        </div>
        <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ width: "100%", height: 10, marginTop: 4 }} />
      <div className="skeleton" style={{ width: "70%", height: 10 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <div className="skeleton" style={{ width: 90, height: 34, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 80, height: 34, borderRadius: 10 }} />
      </div>
    </div>
  );
}

/* ─── Status pill ────────────────────────────────────────── */
function StatusPill({ status }) {
  const safeStatus = status === "no-show" ? "cancelled" : status;

  const cls = {
    pending: "pill-pending", approved: "pill-approved", arrived: "pill-arrived",
    "consultation-started": "pill-started", "consultation-completed": "pill-completed",
    cancelled: "pill-cancelled", rejected: "pill-rejected"
  }[safeStatus] || "";

  const dot = { pending: "#f59e0b", approved: "#3b82f6", arrived: "#06b6d4", "consultation-started": "#6366f1", "consultation-completed": "#0e9f6e", cancelled: "#ef4444", rejected: "#ef4444" }[safeStatus] || "#94a3b8";

  return (
    <span className={`pill ${cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      {safeStatus.replaceAll("-", " ")}
    </span>
  );
}

/* ─── Timeline ───────────────────────────────────────────── */
function Timeline({ status }) {
  const index = FLOW.indexOf(status);
  return (
    <div className="timeline">
      {FLOW.map((item, idx) => (
        <div key={item} className="tl-step">
          <span className={`tl-node ${idx <= index ? "active" : "inactive"}`}>{item.replaceAll("-", " ")}</span>
          {idx < FLOW.length - 1 && <ChevronRight size={10} className="tl-arrow" />}
        </div>
      ))}
    </div>
  );
}

/* ─── Field helpers ──────────────────────────────────────── */
function Field({ label, children, style }) {
  return (
    <div style={style}>
      {label && <p className="field-label">{label}</p>}
      {children}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function DoctorBookings() {
  const dispatch = useDispatch();

  const getAppointmentTimestamp = useCallback((item = {}) => {
    const datePart = String(item?.date || "").trim();
    const timePart = String(item?.time || "").trim();

    if (datePart && timePart) {
      const combined = new Date(`${datePart} ${timePart}`);
      if (!Number.isNaN(combined.getTime())) return combined.getTime();
    }

    if (datePart) {
      const dateOnly = new Date(datePart);
      if (!Number.isNaN(dateOnly.getTime())) return dateOnly.getTime();
    }

    return 0;
  }, []);

  const sortByUpcomingDateTime = useCallback((a, b) => {
    const nowTs = Date.now();
    const aTs = getAppointmentTimestamp(a);
    const bTs = getAppointmentTimestamp(b);

    const aIsUpcoming = aTs >= nowTs;
    const bIsUpcoming = bTs >= nowTs;

    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;

    if (aIsUpcoming && bIsUpcoming) {
      return aTs - bTs;
    }

    return bTs - aTs;
  }, [getAppointmentTimestamp]);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("prescription");
  const [prescription, setPrescription] = useState({ diagnosis: "", medicines: [emptyMedicine()], advice: "", followUpDate: "" });
  const [doctorNotes, setDoctorNotes] = useState(emptyNotes);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, appointmentId: null, action: null, endpoint: null });
  const [messageModal, setMessageModal] = useState({ open: false, appointment: null, subject: "", body: "" });
  const [messageSending, setMessageSending] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({ open: false, appointment: null, reason: "" });
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/appointments/doctor");
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to load appointments", type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchBookings();
    const socket = getSocket();
    socket.on("appointmentStatusUpdate", fetchBookings);
    return () => socket.off("appointmentStatusUpdate", fetchBookings);
  }, [fetchBookings]);

  const normalizeStatusForFilter = useCallback((status) => {
    const value = String(status || "").toLowerCase();
    if (value === "consultation-completed") return "completed";
    if (value === "no-show") return "rejected";
    return value;
  }, []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => normalizeStatusForFilter(booking?.status) === statusFilter);
  }, [bookings, statusFilter, normalizeStatusForFilter]);

  const { grouped, sortedDateKeys } = useMemo(() => {
    const groupedMap = filteredBookings.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});

    const keys = Object.keys(groupedMap).sort((a, b) =>
      sortByUpcomingDateTime(
        { date: a, time: "00:00" },
        { date: b, time: "00:00" }
      )
    );

    keys.forEach((dateKey) => {
      groupedMap[dateKey] = [...groupedMap[dateKey]].sort(sortByUpcomingDateTime);
    });

    return { grouped: groupedMap, sortedDateKeys: keys };
  }, [filteredBookings, sortByUpcomingDateTime]);

  const openClinical = async (appointment) => {
    setSelected(appointment);
    setActiveTab("prescription");
    try {
      const [presRes, noteRes] = await Promise.allSettled([
        API.get(`/appointments/${appointment._id}/prescription`),
        API.get(`/appointments/${appointment._id}/notes`)
      ]);
      if (presRes.status === "fulfilled") {
        const p = presRes.value.data;
        setPrescription({ diagnosis: p.diagnosis || "", medicines: p.medicines?.length ? p.medicines : [emptyMedicine()], advice: p.advice || "", followUpDate: p.followUpDate ? p.followUpDate.slice(0, 10) : "" });
      } else {
        setPrescription({ diagnosis: "", medicines: [emptyMedicine()], advice: "", followUpDate: "" });
      }
      if (noteRes.status === "fulfilled") {
        const n = noteRes.value.data;
        setDoctorNotes({ symptomsObserved: n.symptomsObserved || "", clinicalObservations: n.clinicalObservations || "", suggestedTests: n.suggestedTests || "", internalRemarks: n.internalRemarks || "" });
      } else {
        setDoctorNotes(emptyNotes);
      }
    } catch {
      setPrescription({ diagnosis: "", medicines: [emptyMedicine()], advice: "", followUpDate: "" });
      setDoctorNotes(emptyNotes);
    }
  };

  const openMessage = (appointment) => {
    setMessageModal({
      open: true,
      appointment,
      subject: "Appointment Update",
      body: "",
    });
  };

  const sendMessage = async () => {
    if (!messageModal.appointment?._id) return;
    if (!messageModal.body.trim()) {
      dispatch(showToast({ message: "Please enter a message", type: "warning" }));
      return;
    }
    try {
      setMessageSending(true);
      await API.post("/doctors/messages", {
        appointmentId: messageModal.appointment._id,
        subject: messageModal.subject,
        message: messageModal.body,
      });
      dispatch(showToast({ message: "Message sent to patient", type: "success" }));
      setMessageModal({ open: false, appointment: null, subject: "", body: "" });
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to send message", type: "error" }));
    } finally {
      setMessageSending(false);
    }
  };

  const openCancel = (appointment) => {
    setCancelDialog({ open: true, appointment, reason: "" });
  };

  const submitCancel = async () => {
    if (!cancelDialog.appointment?._id) return;
    const reason = String(cancelDialog.reason || "").trim() || "Cancelled by doctor";
    try {
      setActionLoading({ id: cancelDialog.appointment._id, type: "Cancel" });
      await API.put(`/appointments/${cancelDialog.appointment._id}`, { status: "cancelled", reason });
      dispatch(showToast({ message: "Appointment cancelled", type: "success" }));
      await fetchBookings();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || "Cancellation failed", type: "error" }));
    } finally {
      setActionLoading({ id: null, type: null });
      setCancelDialog({ open: false, appointment: null, reason: "" });
    }
  };

  const askAction = (appointmentId, action, endpoint) => {
    setConfirmDialog({ isOpen: true, appointmentId, action, endpoint });
  };

  const executeAction = async () => {
    const { appointmentId, endpoint, action } = confirmDialog;
    try {
      setActionLoading({ id: appointmentId, type: action });
      await API.put(endpoint);
      dispatch(showToast({ message: `${action} successful`, type: "success" }));
      await fetchBookings();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || "Action failed", type: "error" }));
    } finally {
      setActionLoading({ id: null, type: null });
      setConfirmDialog({ isOpen: false, appointmentId: null, action: null, endpoint: null });
    }
  };

  const saveClinicalData = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await API.post(`/appointments/${selected._id}/prescription`, prescription);
      await API.post(`/appointments/${selected._id}/notes`, doctorNotes);
      dispatch(showToast({ message: "Clinical data saved", type: "success" }));
      await fetchBookings();
      setSelected(null);
      setPrescription({ diagnosis: "", medicines: [emptyMedicine()], advice: "", followUpDate: "" });
      setDoctorNotes(emptyNotes);
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to save clinical data", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const addMedicine = () => setPrescription((prev) => ({ ...prev, medicines: [...prev.medicines, emptyMedicine()] }));
  const removeMedicine = (index) => setPrescription((prev) => ({ ...prev, medicines: prev.medicines.filter((_, idx) => idx !== index) }));
  const updateMedicine = (index, key, value) => {
    setPrescription((prev) => ({ ...prev, medicines: prev.medicines.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)) }));
  };

  const formatDateLabel = (dateValue) => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return String(dateValue);
    return parsed.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const bookingStats = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        const status = String(booking?.status || "").toLowerCase();

        if (status === "pending") acc.pending += 1;
        if (status === "approved") acc.approved += 1;
        if (status === "consultation-completed" || status === "completed") acc.completed += 1;
        if (status === "cancelled") acc.cancelled += 1;
        if (status === "rejected" || status === "no-show") acc.rejected += 1;

        return acc;
      },
      { pending: 0, approved: 0, completed: 0, cancelled: 0, rejected: 0 }
    );
  }, [bookings]);

  const filterButtons = useMemo(() => ([
    { key: "all", label: "All", count: bookings.length },
    { key: "pending", label: "Pending", count: bookingStats.pending },
    { key: "approved", label: "Approved", count: bookingStats.approved },
    { key: "completed", label: "Completed", count: bookingStats.completed },
    { key: "cancelled", label: "Cancelled", count: bookingStats.cancelled },
    { key: "rejected", label: "Rejected", count: bookingStats.rejected },
  ]), [bookings.length, bookingStats]);

  const canCancel = (status) => ["pending", "approved", "arrived"].includes((status || "").toLowerCase());

  return (
    <>
      <style>{STYLES}</style>
      <div className="db-root">
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 48px" }}>

          {/* Page header */}
          <div className="page-header">
            <h1>Doctor Appointments</h1>
            <p>Status flow: Pending → Approved → Arrived → Consultation Started → Completed</p>
          </div>

          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
              {[
                { key: "pending", label: "Pending", value: bookingStats.pending, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                { key: "approved", label: "Approved", value: bookingStats.approved, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                { key: "completed", label: "Completed", value: bookingStats.completed, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
                { key: "cancelled", label: "Cancelled", value: bookingStats.cancelled, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                { key: "rejected", label: "Rejected", value: bookingStats.rejected, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
              ].map((item) => {
                const active = statusFilter === item.key;
                return (
                  <button
                    type="button"
                    onClick={() => setStatusFilter(item.key)}
                    key={item.key}
                    style={{
                      background: active ? item.bg : "#fff",
                      borderRadius: 14,
                      padding: "14px 12px",
                      border: active ? `2px solid ${item.color}` : `1px solid ${item.border}`,
                      boxShadow: active
                        ? "0 8px 20px rgba(37,99,235,0.16)"
                        : "0 2px 10px rgba(37,99,235,0.06)",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: active ? item.color : "#64748b", fontWeight: active ? 700 : 600 }}>
                      {item.label}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && bookings.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {filterButtons.map((filter) => {
                const active = statusFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setStatusFilter(filter.key)}
                    style={{
                      border: active ? "none" : "1px solid #bfdbfe",
                      background: active ? "linear-gradient(135deg,#2563eb,#38bdf8)" : "#eff6ff",
                      color: active ? "#fff" : "#1e3a8a",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Skeleton loading */}
          {loading && (
            <div>
              {[0, 1].map((d) => (
                <section key={d} style={{ marginBottom: 28 }}>
                  <div className="skeleton" style={{ width: 180, height: 14, marginBottom: 14 }} />
                  <div className="appt-grid">
                    <SkeletonCard /><SkeletonCard />
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && bookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><Activity size={24} color="var(--azure)" /></div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: "var(--slate)", margin: "0 0 6px" }}>No appointments yet</p>
              <p style={{ color: "var(--mist)", fontSize: 15, margin: 0 }}>New patient bookings will appear here automatically.</p>
            </div>
          )}

          {!loading && bookings.length > 0 && filteredBookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><AlertTriangle size={24} color="var(--azure)" /></div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: "var(--slate)", margin: "0 0 6px" }}>
                No {statusFilter} appointments found
              </p>
              <p style={{ color: "var(--mist)", fontSize: 15, margin: 0 }}>Filter change karke dusri appointment details dekh sakte ho.</p>
            </div>
          )}

          {/* Appointment list */}
          {!loading && filteredBookings.length > 0 && sortedDateKeys.map((dateKey) => (
            <section key={dateKey} style={{ marginBottom: 28 }}>
              <div className="date-header">
                <Calendar size={15} />
                {formatDateLabel(dateKey)}
                <span style={{ background: "var(--azure-pale)", color: "var(--azure)", borderRadius: 999, padding: "1px 8px", fontSize: 12 }}>
                  {grouped[dateKey].length} appt{grouped[dateKey].length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="appt-grid">
                {grouped[dateKey].map((item) => (
                  <div key={item._id} className="appt-card">
                    {/* Card top */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--azure-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <User size={18} color="var(--azure)" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: "var(--slate)", fontSize: 17, margin: 0 }}>{item.patient?.name}</p>
                          <p style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--mist)", fontSize: 13.5, margin: "3px 0 0" }}>
                            <Mail size={11} />{item.patient?.email}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={item.status} />
                    </div>

                    {/* Time + clinical button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--mist)", fontSize: 14.5 }}>
                        <Clock3 size={13} />{item.time}
                      </span>
                      <button className="btn-clinical" onClick={() => openClinical(item)}>
                        <ClipboardList size={12} /> Clinical Notes
                      </button>
                    </div>

                    {/* Review badge */}
                    {item.review && (
                      <div className="review-badge">
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        {item.review.rating}/5
                        {item.review.comment && <span style={{ color: "#78350f" }}>· {item.review.comment}</span>}
                      </div>
                    )}

                    {/* Timeline */}
                    <Timeline status={item.status} />

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                      <button className="btn btn-ghost" onClick={() => openMessage(item)}>
                        <MessageSquare size={14} /> Message
                      </button>
                      {item.status === "pending" && (
                        <>
                          <button className="btn btn-primary" onClick={() => askAction(item._id, "Approve", `/appointments/${item._id}`)} disabled={actionLoading.id === item._id}>
                            {actionLoading.id === item._id && actionLoading.type === "Approve" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={14} />}
                            Approve
                          </button>
                          <button className="btn btn-danger" onClick={() => askAction(item._id, "Reject", `/appointments/${item._id}`)} disabled={actionLoading.id === item._id}>
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                      {item.status === "arrived" && (
                        <button className="btn btn-indigo" onClick={() => askAction(item._id, "Start Consultation", `/appointments/${item._id}/start-consultation`)} disabled={actionLoading.id === item._id}>
                          <Stethoscope size={14} /> Start Consultation
                        </button>
                      )}
                      {item.status === "consultation-started" && (
                        <button className="btn btn-success" onClick={() => askAction(item._id, "Complete Consultation", `/appointments/${item._id}/complete-consultation`)} disabled={actionLoading.id === item._id}>
                          <CheckCircle2 size={14} /> Complete Consultation
                        </button>
                      )}
                      {canCancel(item.status) && (
                        <button className="btn btn-danger" onClick={() => openCancel(item)} disabled={actionLoading.id === item._id}>
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                      {item.status === "consultation-completed" && (
                        <span className="completed-badge"><CheckCircle2 size={15} /> Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Clinical Modal ── */}
        {selected && (
          <div className="modal-overlay">
            <div className="modal">
              {/* Header */}
              <div className="modal-header">
                <h2><Stethoscope size={20} /> Clinical Documentation</h2>
                <button className="modal-close" onClick={() => setSelected(null)}>
                  <XCircle size={18} />
                </button>
              </div>

              {/* Patient info strip */}
              <div style={{ padding: "14px 24px", background: "var(--azure-pale)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--azure)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={17} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--slate)", fontSize: 16, margin: 0 }}>{selected.patient?.name}</p>
                  <p style={{ color: "var(--mist)", fontSize: 13.5, margin: 0 }}>{selected.patient?.email} · {selected.time}</p>
                </div>
                <div style={{ marginLeft: "auto" }}><StatusPill status={selected.status} /></div>
              </div>

              {/* Tab bar */}
              <div style={{ padding: "16px 24px 0" }}>
                <div className="tab-bar">
                  <button className={`tab-btn ${activeTab === "prescription" ? "active" : "inactive"}`} onClick={() => setActiveTab("prescription")}>
                    <Pill size={14} /> Prescription
                  </button>
                  <button className={`tab-btn ${activeTab === "notes" ? "active" : "inactive"}`} onClick={() => setActiveTab("notes")}>
                    <MessageSquare size={14} /> Private Notes
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="modal-body">

                {/* Prescription tab */}
                {activeTab === "prescription" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Field label="Diagnosis">
                      <textarea className="field" rows={3} placeholder="Describe the diagnosis (min 10 characters)…" value={prescription.diagnosis} onChange={(e) => setPrescription((prev) => ({ ...prev, diagnosis: e.target.value }))} />
                    </Field>

                    <div>
                      <div className="section-head"><Pill size={16} /> Medicines</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {prescription.medicines.map((med, index) => (
                          <div key={index} className="med-card">
                            {prescription.medicines.length > 1 && (
                              <button onClick={() => removeMedicine(index)} style={{ position: "absolute", top: 10, right: 10, background: "#fee2e2", border: "none", borderRadius: 7, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--danger)", fontFamily: "'DM Sans', sans-serif" }}>
                                <Trash2 size={11} /> Remove
                              </button>
                            )}
                            <Field label="Medicine name" style={{ marginBottom: 10 }}>
                              <input className="field" placeholder="e.g. Amoxicillin" value={med.name} onChange={(e) => updateMedicine(index, "name", e.target.value)} />
                            </Field>
                            <div className="modal-grid" style={{ gap: 10, marginBottom: 10 }}>
                              <Field label="Dosage">
                                <input className="field" placeholder="e.g. 500mg" value={med.dosage} onChange={(e) => updateMedicine(index, "dosage", e.target.value)} />
                              </Field>
                              <Field label="Frequency">
                                <input className="field" placeholder="e.g. Twice daily" value={med.frequency} onChange={(e) => updateMedicine(index, "frequency", e.target.value)} />
                              </Field>
                            </div>
                            <div className="modal-grid" style={{ gap: 10 }}>
                              <Field label="Duration">
                                <input className="field" placeholder="e.g. 7 days" value={med.duration} onChange={(e) => updateMedicine(index, "duration", e.target.value)} />
                              </Field>
                              <Field label="Instructions (optional)">
                                <input className="field" placeholder="e.g. After meals" value={med.instructions} onChange={(e) => updateMedicine(index, "instructions", e.target.value)} />
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-ghost" style={{ marginTop: 10, fontSize: 13 }} onClick={addMedicine}>
                        <Plus size={14} /> Add medicine
                      </button>
                    </div>

                    <div className="modal-grid">
                      <Field label="General advice (optional)">
                        <textarea className="field" rows={3} placeholder="Lifestyle advice, diet, precautions…" value={prescription.advice} onChange={(e) => setPrescription((prev) => ({ ...prev, advice: e.target.value }))} />
                      </Field>
                      <Field label="Follow-up date">
                        <input type="date" className="field" value={prescription.followUpDate} onChange={(e) => setPrescription((prev) => ({ ...prev, followUpDate: e.target.value }))} />
                      </Field>
                    </div>
                  </div>
                )}

                {/* Notes tab */}
                {activeTab === "notes" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#92400e", display: "flex", alignItems: "center", gap: 7 }}>
                      <AlertTriangle size={13} /> These notes are private and visible only to you.
                    </div>
                    <div className="modal-grid">
                      <Field label="Symptoms observed">
                        <textarea className="field" rows={4} placeholder="List observed symptoms…" value={doctorNotes.symptomsObserved} onChange={(e) => setDoctorNotes((prev) => ({ ...prev, symptomsObserved: e.target.value }))} />
                      </Field>
                      <Field label="Clinical observations">
                        <textarea className="field" rows={4} placeholder="Physical examination findings…" value={doctorNotes.clinicalObservations} onChange={(e) => setDoctorNotes((prev) => ({ ...prev, clinicalObservations: e.target.value }))} />
                      </Field>
                      <Field label="Suggested tests">
                        <textarea className="field" rows={4} placeholder="Lab tests, imaging, etc…" value={doctorNotes.suggestedTests} onChange={(e) => setDoctorNotes((prev) => ({ ...prev, suggestedTests: e.target.value }))} />
                      </Field>
                      <Field label="Internal remarks">
                        <textarea className="field" rows={4} placeholder="Personal remarks, flags…" value={doctorNotes.internalRemarks} onChange={(e) => setDoctorNotes((prev) => ({ ...prev, internalRemarks: e.target.value }))} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
                <button className="btn btn-primary" disabled={saving} onClick={saveClinicalData}>
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={14} />}
                  Save Clinical Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Message Modal ── */}
        {messageModal.open && messageModal.appointment && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 720 }}>
              <div className="modal-header">
                <h2><MessageSquare size={20} /> Message Patient</h2>
                <button className="modal-close" onClick={() => setMessageModal({ open: false, appointment: null, subject: "", body: "" })}>
                  <XCircle size={18} />
                </button>
              </div>

              <div style={{ padding: "14px 24px", background: "var(--azure-pale)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--azure)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={17} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--slate)", fontSize: 16, margin: 0 }}>{messageModal.appointment.patient?.name}</p>
                  <p style={{ color: "var(--mist)", fontSize: 13.5, margin: 0 }}>{messageModal.appointment.patient?.email}</p>
                </div>
              </div>

              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Subject">
                    <input
                      className="field"
                      value={messageModal.subject}
                      onChange={(e) => setMessageModal((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Appointment update"
                    />
                  </Field>
                  <Field label="Message">
                    <textarea
                      className="field"
                      rows={5}
                      value={messageModal.body}
                      onChange={(e) => setMessageModal((prev) => ({ ...prev, body: e.target.value }))}
                      placeholder="Write a short message for the patient…"
                    />
                  </Field>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setMessageModal({ open: false, appointment: null, subject: "", body: "" })}>Cancel</button>
                <button className="btn btn-primary" disabled={messageSending} onClick={sendMessage}>
                  {messageSending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <MessageSquare size={14} />}
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelDialog.open && cancelDialog.appointment && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h2><XCircle size={20} /> Cancel Appointment</h2>
                <button className="modal-close" onClick={() => setCancelDialog({ open: false, appointment: null, reason: "" })}>
                  <XCircle size={18} />
                </button>
              </div>

              <div style={{ padding: "14px 24px", background: "var(--azure-pale)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--azure)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={17} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--slate)", fontSize: 16, margin: 0 }}>{cancelDialog.appointment.patient?.name}</p>
                  <p style={{ color: "var(--mist)", fontSize: 13.5, margin: 0 }}>{cancelDialog.appointment.patient?.email}</p>
                </div>
              </div>

              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Field label="Reason (sent to patient email)">
                    <textarea
                      className="field"
                      rows={4}
                      value={cancelDialog.reason}
                      onChange={(e) => setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="Write a short reason (optional)"
                    />
                  </Field>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setCancelDialog({ open: false, appointment: null, reason: "" })}>Back</button>
                <button className="btn btn-danger" disabled={actionLoading.id === cancelDialog.appointment._id} onClick={submitCancel}>
                  {actionLoading.id === cancelDialog.appointment._id && actionLoading.type === "Cancel" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={14} />}
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm dialog (unchanged) */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.action || "Confirm"}
          message={`Are you sure you want to ${String(confirmDialog.action || "").toLowerCase()}?`}
          confirmText={confirmDialog.action || "Confirm"}
          backdropClassName="bg-blue-900/20 backdrop-blur-sm"
          isDangerous={["Reject"].includes(confirmDialog.action)}
          onConfirm={async () => {
            if (!confirmDialog.endpoint) return;
            if (confirmDialog.endpoint.endsWith("/appointments/" + confirmDialog.appointmentId)) {
              const statusMap = { Approve: "approved", Reject: "rejected" };
              try {
                setActionLoading({ id: confirmDialog.appointmentId, type: confirmDialog.action });
                await API.put(`/appointments/${confirmDialog.appointmentId}`, { status: statusMap[confirmDialog.action] });
                await fetchBookings();
                dispatch(showToast({ message: `${confirmDialog.action} successful`, type: "success" }));
              } catch (error) {
                dispatch(showToast({ message: error.response?.data?.message || "Action failed", type: "error" }));
              } finally {
                setActionLoading({ id: null, type: null });
                setConfirmDialog({ isOpen: false, appointmentId: null, action: null, endpoint: null });
              }
              return;
            }
            executeAction();
          }}
          onCancel={() => setConfirmDialog({ isOpen: false, appointmentId: null, action: null, endpoint: null })}
        />
      </div>
    </>
  );
}