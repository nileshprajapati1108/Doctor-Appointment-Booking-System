import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../Redux/toastSlice";
import API from "../util/api";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function DoctorApproval() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [pendingRejectionId, setPendingRejectionId] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/doctor-approvals");
      setRequests(res.data || []);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      dispatch(showToast({ 
        message: error.response?.data?.error || "Failed to load doctor requests", 
        type: "error" 
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await API.get(`/admin/doctor-approvals/${id}`);
      setSelectedRequest(res.data);
    } catch (error) {
      dispatch(showToast({ 
        message: error.response?.data?.error || "Failed to load request details", 
        type: "error" 
      }));
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this doctor registration?")) {
      return;
    }

    try {
      setActionLoading(id);
      await API.post(`/admin/doctor-approvals/${id}/approve`);
      dispatch(showToast({ message: "Doctor approved successfully", type: "success" }));
      fetchRequests();
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest(null);
      }
    } catch (error) {
      dispatch(showToast({ 
        message: error.response?.data?.error || "Failed to approve doctor", 
        type: "error" 
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (id) => {
    setPendingRejectionId(id);
    setRejectionReason("");
    setShowRejectionDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      dispatch(showToast({ message: "Please provide a rejection reason", type: "error" }));
      return;
    }

    try {
      setActionLoading(pendingRejectionId);
      await API.post(`/admin/doctor-approvals/${pendingRejectionId}/reject`, {
        rejectionReason: rejectionReason,
      });
      dispatch(showToast({ message: "Doctor request rejected successfully", type: "success" }));
      setShowRejectionDialog(false);
      setPendingRejectionId(null);
      setRejectionReason("");
      fetchRequests();
      if (selectedRequest && selectedRequest._id === pendingRejectionId) {
        setSelectedRequest(null);
      }
    } catch (error) {
      dispatch(showToast({ 
        message: error.response?.data?.error || "Failed to reject doctor request", 
        type: "error" 
      }));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
        <div className="text-center py-20 text-gray-500">Loading doctor requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Doctor Approval</h1>
          <p className="text-gray-600 mt-2">Review and approve pending doctor registration requests</p>
        </div>

        {requests.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Pending Requests</h2>
            <p className="text-gray-600">All doctor registration requests have been processed.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Requests List */}
            <div className="lg:col-span-2 space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{request.fullName}</h3>
                      <p className="text-gray-600 text-sm">{request.email}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Specialization:</span>
                      <p className="font-medium">{request.specialization}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Qualification:</span>
                      <p className="font-medium">{request.medicalQualification}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Experience:</span>
                      <p className="font-medium">{request.yearsOfExperience} years</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Registration ID:</span>
                      <p className="font-medium">{request.medicalRegistrationId}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetails(request._id)}
                      className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md font-medium text-gray-700 transition flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={actionLoading === request._id}
                      className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 rounded-md font-medium text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      {actionLoading === request._id ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRejectClick(request._id)}
                      disabled={actionLoading === request._id}
                      className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 rounded-md font-medium text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-1">
              {selectedRequest ? (
                <div className="card p-6 sticky top-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <EyeOff size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Full Name:</span> <span className="font-medium">{selectedRequest.fullName}</span></p>
                        <p><span className="text-gray-500">Age:</span> <span className="font-medium">{selectedRequest.age}</span></p>
                        <p><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedRequest.email}</span></p>
                        <p><span className="text-gray-500">Mobile:</span> <span className="font-medium">{selectedRequest.mobileNumber}</span></p>
                        <p><span className="text-gray-500">Address:</span> <span className="font-medium">{selectedRequest.residentialAddress}</span></p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Professional Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Qualification:</span> <span className="font-medium">{selectedRequest.medicalQualification}</span></p>
                        <p><span className="text-gray-500">Specialization:</span> <span className="font-medium">{selectedRequest.specialization}</span></p>
                        <p><span className="text-gray-500">Registration ID:</span> <span className="font-medium">{selectedRequest.medicalRegistrationId}</span></p>
                        <p><span className="text-gray-500">Experience:</span> <span className="font-medium">{selectedRequest.yearsOfExperience} years</span></p>
                        <p><span className="text-gray-500">Hospital/Clinic:</span> <span className="font-medium">{selectedRequest.hospitalClinicName}</span></p>
                        <p><span className="text-gray-500">Clinic Address:</span> <span className="font-medium">{selectedRequest.hospitalClinicAddress}</span></p>
                        <p><span className="text-gray-500">Online Fees:</span> <span className="font-medium">₹{selectedRequest.consultationFeesOnline}</span></p>
                        <p><span className="text-gray-500">Offline Fees:</span> <span className="font-medium">₹{selectedRequest.consultationFeesOffline}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-6 text-center text-gray-500">
                  <EyeOff size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a request to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection Dialog */}
        {showRejectionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Doctor Request</h2>
              <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows="4"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setPendingRejectionId(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-md font-medium text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 rounded-md font-medium text-white transition disabled:opacity-50"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
