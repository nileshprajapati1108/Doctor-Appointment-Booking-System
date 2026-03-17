import React from "react";

export default function Navbar() {
  return (
    <nav className="w-full py-3 px-4 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">H</div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Happy Health</div>
            <div className="text-xs text-gray-500">Care that makes you smile</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <a className="text-sm text-gray-600 hover:text-gray-800">Services</a>
          <a className="text-sm text-gray-600 hover:text-gray-800">Doctors</a>
          <a className="text-sm text-gray-600 hover:text-gray-800">Help</a>
        </div>
      </div>
    </nav>
  );
}