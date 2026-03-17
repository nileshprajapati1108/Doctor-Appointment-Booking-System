
import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
	const linkClass = ({ isActive }) =>
		`block px-4 py-2 rounded-md text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`;

	return (
		<aside className="w-64 bg-white border-r hidden lg:block">
			<div className="p-4">
				<div className="text-xs text-gray-500 uppercase mb-3">Navigation</div>
				<nav className="space-y-1">
					<NavLink to="/patient" className={linkClass} end>
						Dashboard
					</NavLink>
					<NavLink to="/patient/profile" className={linkClass}>
						Profile
					</NavLink>
					<NavLink to="/patient/appointments" className={linkClass}>
						Appointments
					</NavLink>
					<NavLink to="/patient/browse-services" className={linkClass}>
						Browse Services
					</NavLink>
				</nav>
			</div>
		</aside>
	);
}
