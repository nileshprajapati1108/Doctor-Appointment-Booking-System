import React, { useState } from "react";

export default function DoctorAvatar({ doctor, size = "w-16 h-16" }) {
  const [imageError, setImageError] = useState(false);
  
  const doctorName = doctor?.user?.name || doctor?.name || "D";
  const avatarUrl = doctor?.user?.avatar || doctor?.avatar;
  const firstLetter = doctorName.charAt(0).toUpperCase();
  
  // Color palette for initials
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  
  // Consistent color based on doctor name
  const colorIndex = doctorName.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  if (avatarUrl && !imageError) {
    return (
      <img
          src={avatarUrl}
          alt={doctorName}
          onError={() => setImageError(true)}
          className={`${size} rounded-full border-2 border-blue-400 object-cover`}
        />
    );
  }

  return (
    <div
      className={`${size} rounded-full border-2 border-blue-400 ${bgColor} flex items-center justify-center text-white font-bold text-lg`}
    >
      {firstLetter}
    </div>
  );
}
