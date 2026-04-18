/**
 * pages/Signup.jsx
 * Register a new user. After signup, redirect to society setup.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";

export default function Signup() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      login(data.user, data.token);
      toast.success("Account created! Now set up your society. 🏡");
      navigate("/society-setup");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-saffron-50">
      {/* Subtle background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-saffron-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-leaf-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-saffron-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-3xl">🏡</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-soil-900">Join Society Connect</h1>
          <p className="text-soil-500 text-sm mt-1">Create your account to get started.</p>
        </div>

        <div className="card shadow-lg border-saffron-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="Ramesh Kumar"
                value={form.name}
                onChange={handleChange}
                maxLength={60}
                required
                autoComplete="name"
              />
            </div>

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
              <label className="label" htmlFor="password">
                Password
                <span className="text-soil-400 font-normal ml-1">(min 6 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-soil-400 hover:text-soil-600 text-sm"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        form.password.length >= level * 3
                          ? level <= 2 ? "bg-saffron-400" : "bg-leaf-500"
                          : "bg-saffron-100"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-soil-500">
          Already have an account?{" "}
          <Link to="/login" className="text-saffron-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
