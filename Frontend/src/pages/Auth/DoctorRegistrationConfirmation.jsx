import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function DoctorRegistrationConfirmation() {
  const location = useLocation();
  const email = location.state?.email || "";
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Request Submitted Successfully!</h1>
          <p className="text-gray-600">
            Your request has been sent to the admin. Please wait for approval.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>What happens next?</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 text-left space-y-1 list-disc list-inside">
            <li>Your registration request is now pending admin review</li>
            <li>You will receive an email at <strong>{email}</strong> once your request is reviewed</li>
            <li>If approved, you'll receive login credentials via email</li>
            <li>If rejected, you'll receive a reason for rejection</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full py-2.5 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
          >
            Go to Login
          </Link>
          <button
            onClick={() => navigate("/")}
            className="block w-full py-2.5 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
