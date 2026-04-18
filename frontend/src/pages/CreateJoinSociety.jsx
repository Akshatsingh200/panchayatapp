/**
 * pages/CreateJoinSociety.jsx
 * Step shown right after signup (or when user has no society).
 * Option 1: Create a new society → become admin
 * Option 2: Join existing with invite code → become member
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";

export default function CreateJoinSociety() {
  const { updateUser, fetchMe } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("create"); // "create" | "join"

  // Create form
  const [createForm, setCreateForm] = useState({ name: "", description: "", address: "" });
  // Join form
  const [joinForm, setJoinForm] = useState({ inviteCode: "" });

  const [loading, setLoading] = useState(false);

  // ── Create Society ────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Society name is required.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/societies/create", createForm);
      // Refresh user profile to get updated societyId + role
      await fetchMe();
      toast.success(`"${data.society.name}" created! 🏡 Your invite code: ${data.society.inviteCode}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Join Society ──────────────────────────────────────────
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinForm.inviteCode.trim()) {
      toast.error("Enter the invite code.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/societies/join", joinForm);
      await fetchMe();
      toast.success(`Welcome to ${data.society.name}! 🎉`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-saffron-50">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-200 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-leaf-200 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏘️</div>
          <h1 className="font-display text-2xl font-bold text-soil-900">
            Set Up Your Society
          </h1>
          <p className="text-soil-500 text-sm mt-2">
            Create a new society or join one with an invite code.
          </p>
        </div>

        <div className="card shadow-lg p-6">
          {/* Tabs */}
          <div className="flex bg-saffron-50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab("create")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${tab === "create"
                  ? "bg-white text-saffron-700 shadow-sm"
                  : "text-soil-500 hover:text-soil-700"
                }`}
            >
              🏗️ Create Society
            </button>
            <button
              onClick={() => setTab("join")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${tab === "join"
                  ? "bg-white text-saffron-700 shadow-sm"
                  : "text-soil-500 hover:text-soil-700"
                }`}
            >
              🔑 Join with Code
            </button>
          </div>

          {/* ── Create Tab ─────────────────────────────────── */}
          {tab === "create" && (
            <form onSubmit={handleCreate} className="space-y-4 animate-fade-in">
              <div className="bg-saffron-50 border border-saffron-200 rounded-xl p-3 text-sm text-saffron-700">
                <strong>You'll become the Admin</strong> of this society and can manage members and settings.
              </div>

              <div>
                <label className="label" htmlFor="soc-name">Society Name *</label>
                <input
                  id="soc-name"
                  className="input"
                  placeholder="e.g. Adarsh Nagar RWA, Green Valley Apartments"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="soc-desc">Description</label>
                <textarea
                  id="soc-desc"
                  className="input resize-none"
                  placeholder="Tell residents what this society is about…"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={300}
                />
              </div>

              <div>
                <label className="label" htmlFor="soc-addr">Address / Location</label>
                <input
                  id="soc-addr"
                  className="input"
                  placeholder="Sector 18, Noida, UP"
                  value={createForm.address}
                  onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : (
                  "Create My Society 🏡"
                )}
              </button>
            </form>
          )}

          {/* ── Join Tab ────────────────────────────────────── */}
          {tab === "join" && (
            <form onSubmit={handleJoin} className="space-y-4 animate-fade-in">
              <div className="bg-leaf-50 border border-leaf-200 rounded-xl p-3 text-sm text-leaf-700">
                Ask your society admin for the <strong>invite code</strong> to join.
              </div>

              <div>
                <label className="label" htmlFor="invite-code">Invite Code</label>
                <input
                  id="invite-code"
                  className="input text-center tracking-[0.3em] text-lg font-mono uppercase"
                  placeholder="ABC12345"
                  value={joinForm.inviteCode}
                  onChange={(e) =>
                    setJoinForm({ inviteCode: e.target.value.toUpperCase().slice(0, 12) })
                  }
                  required
                />
                <p className="text-xs text-soil-400 mt-1.5">
                  Codes are case-insensitive and shared by your society admin.
                </p>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Joining…
                  </span>
                ) : (
                  "Join Society 🤝"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
