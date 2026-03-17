// src/pages/DoctorServices.jsx
import React, { useState } from "react";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function DoctorServices() {
  const [services, setServices] = useState([
    {
      id: 1,
      name: "General Consultation",
      desc: "40-min consultation session for general health checkup and diagnosis.",
      price: 50,
      duration: 40,
      appointments: 45,
      status: "active",
      category: "General",
    },
    {
      id: 2,
      name: "Pediatric Consultation",
      desc: "Specialized consultation for children’s health and growth checkups.",
      price: 70,
      duration: 40,
      appointments: 20,
      status: "paused",
      category: "Pediatrics",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    price: "",
    duration: "",
    category: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (editingService) {
      // Update existing service
      setServices(
        services.map((s) =>
          s.id === editingService.id ? { ...s, ...formData } : s
        )
      );
    } else {
      // Add new service
      setServices([
        ...services,
        {
          id: Date.now(),
          ...formData,
          price: Number(formData.price),
          duration: Number(formData.duration),
          appointments: 0,
          status: "active",
        },
      ]);
    }
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({
      name: "",
      desc: "",
      price: "",
      duration: "",
      category: "",
    });
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData(service);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const toggleStatus = (id) => {
    setServices(
      services.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 md:items-center md:flex-row flex-col gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Services</h1>
            <p className="text-gray-600 mt-2">Manage your medical services and consultation offerings</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary px-6 py-2.5"
          >
            + Add New Service
          </button>
        </div>

        {/* Services List */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {services.map((service) => (
            <div key={service.id} className="card p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {service.name}
                  </h2>
                  <span
                    className={`text-xs font-semibold mt-2 inline-block px-3 py-1 rounded-full ${
                      service.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600 font-medium"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition text-red-600 font-medium"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{service.desc}</p>
              <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-blue-600 text-lg">₹{service.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{service.duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Appointments:</span>
                  <span className="font-medium">{service.appointments}</span>
                </div>
              </div>
              <button
                onClick={() => toggleStatus(service.id)}
                className={`w-full py-2 rounded-lg transition font-medium ${
                  service.status === "active"
                    ? "border border-blue-400 text-blue-600 hover:bg-blue-50"
                    : "border border-green-400 text-green-600 hover:bg-green-50"
                }`}
              >
                {service.status === "active" ? "⏸ Pause" : "▶ Activate"}
              </button>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 text-center">
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {services.filter((s) => s.status === "active").length}
            </p>
            <p className="text-gray-600 font-medium">Active Services</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {services.reduce((acc, s) => acc + s.appointments, 0)}
            </p>
            <p className="text-gray-600 font-medium">Total Appointments</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ₹{Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length)}
            </p>
            <p className="text-gray-600 font-medium">Avg Consultation Fee</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-3xl font-bold text-green-600 mb-2">4.9</p>
            <p className="text-gray-600 font-medium">Avg Rating</p>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Background blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            {/* Modal box */}
            <div className="relative bg-white rounded-lg w-full max-w-lg p-8 shadow-2xl z-10">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingService ? "Edit Service" : "Create New Service"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-900 text-sm font-semibold mb-2">
                    Service Title
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., General Consultation"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-900 text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    name="desc"
                    value={formData.desc}
                    onChange={handleChange}
                    placeholder="Describe this service..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-900 text-sm font-semibold mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 text-sm font-semibold mb-2">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="30"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-900 text-sm font-semibold mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Pediatrics"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary px-6 py-2.5"
                >
                  {editingService ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
