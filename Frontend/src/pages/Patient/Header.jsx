import React from "react";
import { Search, Bell } from "lucide-react";

export default function PatientHeader({ title = "Dashboard" }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-white via-yellow-50 to-yellow-100 border-b">
      {/* Left - Title */}
      <h1 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
        {title}
      </h1>

      {/* Right - Search + Notifications */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center border border-yellow-400 rounded-lg px-3 py-1 bg-white">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search services..."
            className="ml-2 bg-transparent focus:outline-none text-sm text-slate-600"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Bell size={20} className="text-slate-600 cursor-pointer" />
          <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            2
          </span>
        </div>
      </div>
    </header>
  );
}
