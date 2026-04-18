/**
 * pages/Profile.jsx
 * User profile page — view and edit name, bio.
 * Also shows society membership info and recent activity stats.
 */

import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { disconnectSocket } from "../utils/socket";
import api from "../utils/api";
import { getInitials, getAvatarColor, getErrorMessage, timeAgo } from "../utils/helpers";

export default function Profile() {
  const { user, isAdmin, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    name: user?.name || "",
    bio:  user?.bio  || "",
  });

  const initials    = getInitials(user?.name);
  const avatarColor = getAvatarColor(user?.name);

  const societyName =
    typeof user?.societyId === "object"
      ? user.societyId?.name
      : null;

  // ── Save profile edits ────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", {
        name: form.name,
        bio:  form.bio,
      });
      updateUser({ name: data.user.name, bio: data.user.bio });
      toast.success("Profile updated ✅");
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/login");
  };

  return (
    <div className="page-container max-w-lg">
      <h1 className="font-display text-2xl font-bold text-soil-900 mb-6">
        👤 My Profile
      </h1>

      {/* ── Profile card ─────────────────────────────────── */}
      <div className="card mb-4">
        {/* Avatar + role */}
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${avatarColor}`}
          >
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-lg font-bold text-soil-900">
                {user?.name}
              </h2>
              {isAdmin && <span className="badge-admin">Admin</span>}
            </div>
            <p className="text-sm text-soil-500">{user?.email}</p>
            {user?.bio ? (
              <p className="text-sm text-soil-600 mt-1.5 italic">"{user.bio}"</p>
            ) : (
              <p className="text-sm text-soil-400 mt-1.5">No bio yet.</p>
            )}
          </div>

          {/* Edit toggle */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary text-sm px-3 py-2"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {/* ── Edit form ──────────────────────────────────── */}
        {editing && (
          <form onSubmit={handleSave} className="mt-5 pt-5 border-t border-saffron-100 space-y-4 animate-fade-in">
            <div>
              <label className="label" htmlFor="p-name">Full Name</label>
              <input
                id="p-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 60) }))}
                maxLength={60}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="p-bio">
                Bio
                <span className="text-soil-400 font-normal ml-1">
                  ({form.bio.length}/200)
                </span>
              </label>
              <textarea
                id="p-bio"
                className="input resize-none"
                rows={3}
                placeholder="Tell your neighbors a bit about yourself…"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 200) }))}
                maxLength={200}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm({ name: user?.name || "", bio: user?.bio || "" });
                }}
                className="btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 text-sm" disabled={saving}>
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Society membership card ──────────────────────── */}
      <div className="card mb-4">
        <h3 className="font-display font-semibold text-soil-800 mb-3">
          🏘️ Society Membership
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-soil-500">Society</span>
            <span className="font-medium text-soil-800">
              {societyName || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-soil-500">Role</span>
            <span className="flex items-center gap-1.5">
              {isAdmin ? (
                <span className="badge-admin">Admin</span>
              ) : (
                <span className="text-soil-700 font-medium">Member</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-soil-500">Member since</span>
            <span className="text-soil-700">{timeAgo(user?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* ── Account actions ──────────────────────────────── */}
      <div className="card border-red-100 bg-red-50/30">
        <h3 className="font-display font-semibold text-soil-800 mb-3">
          Account
        </h3>
        <p className="text-sm text-soil-500 mb-4">
          Logging out will disconnect you from real-time chat and notifications.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 transition-all"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
