// src/Redux/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

// ✅ Initialize from localStorage
const storedAuth = localStorage.getItem("auth");
let initialUser = null;
let initialToken = null;

if (storedAuth) {
  try {
    const parsed = JSON.parse(storedAuth);
    initialUser = parsed.user;
    initialToken = parsed.token;
  } catch (e) {
    console.error("Failed to parse stored auth:", e);
    localStorage.removeItem("auth");
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken,
  },
  reducers: {
    loginSuccess: (state, action) => {
      // ✅ Backend returns: { _id, name, email, role, token }
      const { _id, name, email, role, token, profileImage, medicalHistory } = action.payload;
      
      state.user = { _id, name, email, role, profileImage: profileImage || "", medicalHistory: medicalHistory || {} };
      state.token = token;
      state.isAuthenticated = true;

      // ✅ Store as single object
      localStorage.setItem("auth", JSON.stringify({
        user: { _id, name, email, role, profileImage: profileImage || "", medicalHistory: medicalHistory || {} },
        token
      }));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("auth");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("auth", JSON.stringify({
        user: state.user,
        token: state.token
      }));
    }
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;