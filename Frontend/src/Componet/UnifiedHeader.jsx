import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Loader2 } from "lucide-react";
import API from "../pages/util/api";
import { logout } from "../Redux/authSlice";

export default function UnifiedHeader() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isClearing, setIsClearing] = useState(false);

  const { user } = useSelector((state) => state.auth);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      if (Array.isArray(res.data)) {
        // Show last 5 notifications regardless of read status
        setNotifications(res.data.slice(0, 5));
      }
    } catch (error) {
      console.log("Notifications not available");
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    try {
      await Promise.all(
        unread.map((n) => API.patch(`/notifications/${n._id}/read`))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  const performClearAll = async () => {
    if (notifications.length === 0) return;

    setIsClearing(true);
    try {
      await API.delete("/notifications");
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await API.patch(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  const getInitial = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm sticky top-0 z-40">
      {/* Left: Welcome message */}
      <div>
          <h1 className="text-lg font-semibold text-gray-800">
          Welcome back,{" "}
          <span className="text-blue-600">{user?.name || "User"}!</span>
        </h1>
        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-800">
                  Notifications
                </h3>
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={performClearAll}
                      disabled={isClearing}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      {isClearing ? <Loader2 size={12} className="animate-spin" /> : "Clear all"}
                    </button>
                  )}
                  <button
                      onClick={fetchNotifications}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition ${
                        notif.isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className={`text-sm ${notif.isRead ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                            {notif.message || "New notification"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.createdAt
                              ? new Date(notif.createdAt).toLocaleDateString()
                              : "Just now"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center text-white font-bold text-sm">
            {getInitial(user?.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-red-50 transition text-red-600"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

    </header>
  );
}
