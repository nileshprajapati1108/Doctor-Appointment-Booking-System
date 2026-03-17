import React, { useEffect, useState } from "react";
import API from "../util/api";
import { useSelector, useDispatch } from "react-redux";
import { setDoctorProfile } from "../../Redux/doctorSlice";
import { showToast } from "../../Redux/toastSlice";
import { useNavigate } from "react-router-dom";

const specializations = [
  "Cardiologists",
  "Pediatricians",
  "Neurologists",
  "Dermatologists",
  "Dentists",
  "General Physicians"
];

const qualifications = [
  "MBBS", "BDS", "MD", "MS", "Other"
];

// Calculate profile completion percentage
const calculateCompletion = (profileData) => {
  const fields = [
    profileData.fullName,
    profileData.email,
    profileData.mobileNumber,
    profileData.address,
    (profileData.medicalQualification === 'Other' ? profileData.otherQualification : profileData.medicalQualification),
    profileData.specialization,
    profileData.medicalRegistrationId,
    profileData.yearsOfExperience,
    profileData.hospitalClinicName,
    profileData.hospitalClinicAddress,
    profileData.fees,
    profileData.profileImage,
  ];
  const filledFields = fields.filter(field => field && field !== "" && field !== 0).length;
  return Math.round((filledFields / fields.length) * 100);
};

export default function DoctorProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const [profile, setProfile] = useState({
    // Personal Information
    fullName: "",
    email: "",
    age: "",
    mobileNumber: "",
    address: "",
    
    // Professional Information
    medicalQualification: "MBBS",
    otherQualification: "",
    specialization: "General Physicians",
    medicalRegistrationId: "",
    yearsOfExperience: "",
    hospitalClinicName: "",
    hospitalClinicAddress: "",
    fees: "",
    
    // Profile Image
    profileImage: "",
    
    // Status
    status: "pending",
  });

  const [previewImage, setPreviewImage] = useState("");
  const [profileCompletion, setProfileCompletion] = useState(0);


  // Generate avatar from name
  const generateAvatar = (name) => {
    if (!name) return "";
    const firstLetter = name.charAt(0).toUpperCase();
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
      "bg-indigo-500", "bg-blue-500", "bg-red-500", "bg-teal-500"
    ];
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    return { letter: firstLetter, color: colors[colorIndex] };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/doctors/profile");
        
        const isKnownQualification = qualifications.includes(data.medicalQualification);
        setProfile({
          fullName: data.fullName || "",
          email: data.email || "",
          age: data.age || "",
          mobileNumber: data.mobileNumber || "",
          address: data.address || "",
          medicalQualification: isKnownQualification ? (data.medicalQualification || "MBBS") : "Other",
          otherQualification: isKnownQualification ? "" : (data.medicalQualification || ""),
          specialization: data.specialization || "General Physicians",
          medicalRegistrationId: data.medicalRegistrationId || "",
          yearsOfExperience: data.yearsOfExperience || "",
          hospitalClinicName: data.hospitalClinicName || "",
          hospitalClinicAddress: data.hospitalClinicAddress || "",
          fees: data.fees || data.consultationFeesOnline || data.consultationFeesOffline || "",
          profileImage: data.profileImage || "",
          status: data.status || "pending",
        });
        
        setPreviewImage(data.profileImage || "");
        setProfileCompletion(calculateCompletion(data));
        dispatch(setDoctorProfile(data));
        
        // Check if first login
        if (user?.isFirstLogin) {
          setIsFirstLogin(true);
          dispatch(showToast({ 
            message: "Welcome! Please complete your profile setup.", 
            type: "info" 
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        dispatch(showToast({ 
          message: err.response?.data?.message || "Failed to load profile", 
          type: "error" 
        }));
      } finally {
        setLoading(false);
      }
    };
    
    if (user?._id) {
      fetchProfile();
    }
  }, [user, dispatch]);

  const handleChange = (field, value) => {
    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);
    setProfileCompletion(calculateCompletion(updatedProfile));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        dispatch(showToast({ 
          message: "Image size must be less than 5MB", 
          type: "error" 
        }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        dispatch(showToast({ 
          message: "Please upload a valid image file", 
          type: "error" 
        }));
        return;
      }
      
      setProfile({ ...profile, profileImage: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // Age validation
    if (Number(profile.age) < 20) {
      dispatch(showToast({ message: "Age must be at least 20.", type: "error" }));
      return;
    }

    // Validation
    if (!profile.fullName || !profile.mobileNumber || !profile.address) {
      dispatch(showToast({ 
        message: "Please fill in all required personal information fields", 
        type: "error" 
      }));
      return;
    }

    if (!profile.medicalQualification || !profile.specialization || 
        !profile.yearsOfExperience || !profile.hospitalClinicName || 
        !profile.hospitalClinicAddress) {
      dispatch(showToast({ 
        message: "Please fill in all required professional information fields", 
        type: "error" 
      }));
      return;
    }

    if (profile.medicalQualification === 'Other' && !profile.otherQualification.trim()) {
      dispatch(showToast({ message: 'Please specify your qualification', type: 'error' }));
      return;
    }

    if (!profile.fees) {
      dispatch(showToast({ 
        message: "Please enter your consultation fee", 
        type: "error" 
      }));
      return;
    }

    // Validate numeric fields
    if (isNaN(profile.yearsOfExperience) || Number(profile.yearsOfExperience) < 0) {
      dispatch(showToast({ 
        message: "Years of experience must be a valid number", 
        type: "error" 
      }));
      return;
    }

    if (isNaN(profile.fees) || Number(profile.fees) < 0) {
      dispatch(showToast({ 
        message: "Consultation fees must be a valid number", 
        type: "error" 
      }));
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      
      // Personal Information
      formData.append("fullName", profile.fullName);
      formData.append("mobileNumber", profile.mobileNumber);
      formData.append("address", profile.address);
      formData.append("age", profile.age);
      
      // Professional Information
      if (profile.medicalQualification === 'Other') {
        formData.append("medicalQualification", profile.otherQualification);
      } else {
        formData.append("medicalQualification", profile.medicalQualification);
      }
      formData.append("specialization", profile.specialization);
      formData.append("yearsOfExperience", profile.yearsOfExperience);
      formData.append("hospitalClinicName", profile.hospitalClinicName);
      formData.append("hospitalClinicAddress", profile.hospitalClinicAddress);
      formData.append("fees", profile.fees);
      
      // Only append image if it's a File object (not a string URL)
      if (profile.profileImage && profile.profileImage instanceof File) {
        formData.append("profileImage", profile.profileImage);
      }

      const response = await API.post("/doctors/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.doctor) {
        setProfile({ ...response.data.doctor });
        setPreviewImage(response.data.doctor.profileImage || "");
        setProfileCompletion(calculateCompletion(response.data.doctor));
        dispatch(setDoctorProfile(response.data.doctor));
        
        // Clear first login flag after saving
        if (isFirstLogin) {
          try {
            await API.post("/auth/clear-first-login");
            setIsFirstLogin(false);
          } catch (err) {
            console.error("Failed to clear first login flag:", err);
            // Continue anyway
          }
        }
      }
      
      setEditMode(false);
      dispatch(showToast({ message: "Profile saved successfully!", type: "success" }));
      
    } catch (err) {
      console.error("Save error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Error saving profile";
      dispatch(showToast({ message: errorMessage, type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const avatar = generateAvatar(profile.fullName);
  const hasProfileImage = previewImage && previewImage !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Profile Completion */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Doctor Profile</h1>
              <p className="text-gray-600 mt-2">Manage your professional information</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => (editMode ? handleSave() : setEditMode(true))}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editMode ? (saving ? "Saving..." : "Save Changes") : "Edit Profile"}
              </button>
              {!editMode && (
                <button
                  onClick={() => navigate("/doctor")}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
          
          {/* Profile Completion Indicator */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-bold text-blue-600">{profileCompletion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            {profileCompletion < 100 && (
              <p className="text-xs text-gray-500 mt-2">
                Complete your profile to improve visibility and patient trust
              </p>
            )}
          </div>
        </div>

        {/* First Login Welcome Banner */}
        {isFirstLogin && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">👋</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Welcome! Complete Your Profile</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Your registration data has been pre-filled. Please review and update your profile information.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              {hasProfileImage ? (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-32 h-32 rounded-full ${avatar.color} flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-blue-500`}>
                  {avatar.letter}
                </div>
              )}
              {editMode && (
                <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-3 cursor-pointer hover:bg-blue-600 transition shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 1 012-2h.93a2 2 1 001.664-.89l.812-1.22A2 2 1 0110.07 4h3.86a2 2 1 011.664.89l.812 1.22A2 2 1 0018.07 7H19a2 2 1 012 2v9a2 2 1 01-2 2H5a2 2 1 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/jpg,image/png"
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                    <select
                      value={profile.specialization}
                      onChange={(e) => handleChange("specialization", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select specialization...</option>
                      {specializations.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile.status === "approved" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {profile.status === "approved" ? "✓ Approved" : "Pending"}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{profile.fullName || "Doctor Name"}</h2>
                  <p className="text-xl text-blue-600 font-semibold mb-4">{profile.specialization || "Specialization"}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile.status === "approved" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {profile.status === "approved" ? "✓ Active" : "Pending Approval"}
                    </span>
                  </div>
                  {!hasProfileImage && (
                    <p className="text-sm text-gray-500 mt-3">
                      💡 Upload a profile picture to improve your professional presence
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.fullName || "Not provided"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <p className="text-gray-600 py-2.5">{profile.email || "Not provided"}</p>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={profile.mobileNumber}
                  onChange={(e) => handleChange("mobileNumber", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.mobileNumber || "Not provided"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              {editMode ? (
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.age || "Not provided"}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <textarea
                  value={profile.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.address || "Not provided"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Qualification {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <>
                  <select name="medicalQualification" value={profile.medicalQualification} onChange={(e) => handleChange("medicalQualification", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                  {profile.medicalQualification === "Other" && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Please Specify Qualification</label>
                      <input type="text" name="otherQualification" value={profile.otherQualification} onChange={(e) => handleChange("otherQualification", e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter your qualification" required />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-900 py-2.5">
                  {profile.medicalQualification === 'Other' 
                    ? profile.otherQualification 
                    : profile.medicalQualification || "Not provided"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <select
                  value={profile.specialization}
                  onChange={(e) => handleChange("specialization", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {specializations.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                </select>
              ) : (
                <p className="text-gray-900 py-2.5">{profile.specialization || "Not provided"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Registration / Doctor ID Number
              </label>
              <p className="text-gray-600 py-2.5">{profile.medicalRegistrationId || "Not provided"}</p>
              <p className="text-xs text-gray-500 mt-1">This field cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <input
                  type="number"
                  min="0"
                  value={profile.yearsOfExperience}
                  onChange={(e) => handleChange("yearsOfExperience", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.yearsOfExperience || "Not provided"} years</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital / Clinic Name {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={profile.hospitalClinicName}
                  onChange={(e) => handleChange("hospitalClinicName", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.hospitalClinicName || "Not provided"}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital / Clinic Address {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <textarea
                  value={profile.hospitalClinicAddress}
                  onChange={(e) => handleChange("hospitalClinicAddress", e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">{profile.hospitalClinicAddress || "Not provided"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Fees ₹ {editMode && <span className="text-red-500">*</span>}
              </label>
              {editMode ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profile.fees}
                  onChange={(e) => handleChange("fees", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2.5">₹{profile.fees || "Not provided"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {editMode && (
          <div className="flex justify-end gap-4 mb-6">
            <button
              onClick={() => {
                setEditMode(false);
                // Reload profile to reset changes
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
