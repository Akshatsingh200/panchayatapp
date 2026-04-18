/**
 * context/AuthContext.jsx
 * Provides global auth state (user, token) and helper functions.
 * Components consume this via the `useAuth` hook.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem("sc_token") || null);
  const [loading, setLoading] = useState(true); // Initial profile load

  // ── Fetch current user from /api/auth/me ──────────────────
  const fetchMe = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      // Token invalid — clear everything
      localStorage.removeItem("sc_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  // ── Login ──────────────────────────────────────────────────
  const login = (userData, jwt) => {
    localStorage.setItem("sc_token", jwt);
    setToken(jwt);
    setUser(userData);
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("sc_token");
    setToken(null);
    setUser(null);
  };

  // ── Update user in context (e.g., after joining society) ──
  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const isAdmin = user?.role === "admin";
  const hasSociety = !!user?.societyId;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAdmin, hasSociety, login, logout, updateUser, fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
