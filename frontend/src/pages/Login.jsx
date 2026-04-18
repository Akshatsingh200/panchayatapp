/**
 * pages/Login.jsx
 * Email + password login with JWT. Redirects to /dashboard on success.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 🙏`);
      // Route based on society membership
      navigate(data.user.societyId ? "/dashboard" : "/society-setup");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel (decorative) ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-saffron-500 to-soil-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {["🏡", "🌿", "🤝", "🌻", "🏘️", "🎋"].map((em, i) => (
            <span
              key={i}
              className="absolute text-6xl select-none"
              style={{ top: `${(i * 19 + 5) % 90}%`, left: `${(i * 17 + 3) % 85}%` }}
            >
              {em}
            </span>
          ))}
        </div>

        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
            <span className="text-3xl">🏡</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            Society Connect
          </h1>
          <p className="mt-3 text-saffron-100 text-lg">
            Your community, your conversations.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: "🔒", text: "Private, isolated society spaces" },
            { icon: "💬", text: "Real-time community chat" },
            { icon: "🤝", text: "Help your neighbors in need" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/90">
              <span className="text-xl">{icon}</span>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (form) ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-saffron-500 rounded-xl flex items-center justify-center">
              <span className="text-lg">🏡</span>
            </div>
            <span className="font-display text-xl font-bold text-soil-900">Society Connect</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-soil-900 mb-1">
            Welcome back 🙏
          </h2>
          <p className="text-soil-500 text-sm mb-7">
            Sign in to access your community.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-soil-400 hover:text-soil-600 text-sm"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-soil-500">
            New to Society Connect?{" "}
            <Link to="/signup" className="text-saffron-600 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
