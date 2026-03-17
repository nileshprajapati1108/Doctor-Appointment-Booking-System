import React from "react";
import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import API from "../util/api";
import { logout } from "../../Redux/authSlice";
import {
  HomeIcon,
  UserIcon,
  GiftIcon,
  CalendarIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      dispatch(logout());
      navigate("/login");
    }
  };

  const menu = [
    { name: "Dashboard", icon: HomeIcon, path: "/doctor", exact: true }, // exact match
    { name: "Profile", icon: UserIcon, path: "/doctor/profile" },
    { name: "Calendar", icon: CalendarIcon, path: "/doctor/calendar" },
    { name: "Bookings", icon: BookOpenIcon, path: "/doctor/bookings" },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r flex flex-col justify-between p-6">
      {/* Top Logo/Brand */}
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600">Happy Health</h1>
          <p className="text-sm text-gray-500">Doctor Portal</p>
        </div>

        {/* Navigation */}
        <nav>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            Navigation
          </h2>
          <ul className="space-y-3">
            {menu.map((item, i) => (
              <li key={i}>
                <NavLink
                  to={item.path}
                  end={item.exact || false} // <-- only Dashboard gets "end"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 cursor-pointer px-2 py-2 rounded-md ${
                      isActive
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Bottom Sign Out */}
      <div className="space-y-3 border-t pt-4">
        <button onClick={handleLogout} className="flex items-center space-x-3 text-red-600 hover:text-red-700 cursor-pointer">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
