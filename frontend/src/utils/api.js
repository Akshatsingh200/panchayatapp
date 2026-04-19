/**
 * utils/api.js
 * Axios instance pre-configured with base URL and JWT interceptor.
 * All requests automatically include Authorization header if token exists.
 */

import axios from "axios";

const api = axios.create({
  baseURL: "https://panchayatapp.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 globally ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clean up
      localStorage.removeItem("sc_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
