import React from "react";
import DoctorAvailability from "./DoctorAvailability";

export default function SetAvailability() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Availability Management</h1>
          <p className="text-gray-600 mt-2">Set your weekly schedule and date-specific exceptions</p>
        </div>
        
        <DoctorAvailability />
      </div>
    </div>
  );
}
