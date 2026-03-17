import { Bell, Search, ChevronDown } from "lucide-react";

export default function AdminHeader() {
  return (
    <header className="flex items-center  justify-between px-6 py-3 bg-white shadow-sm sticky top-0 z-50">
      {/* Left - Title */}
      <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>

      {/* Middle - Search */}
      <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-80">
        <Search className="w-4 h-4 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent w-full focus:outline-none text-sm text-gray-700"
        />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative text-gray-600 hover:text-gray-900">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src="https://i.pravatar.cc/40?img=1"
            alt="Admin"
            className="w-8 h-8 rounded-full border"
          />
          <span className="text-sm font-medium text-gray-700">Admin</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </header>
  );
}
