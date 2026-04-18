/**
 * pages/Members.jsx
 * Lists all society members. Admins can remove members and manage the invite code.
 */

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { timeAgo, getInitials, getAvatarColor, getErrorMessage } from "../utils/helpers";

// ── Skeleton row ──────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3">
    <div className="skeleton w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3 w-32 rounded" />
      <div className="skeleton h-3 w-48 rounded" />
    </div>
  </div>
);

export default function Members() {
  const { user, isAdmin } = useAuth();

  const [members, setMembers]       = useState([]);
  const [society, setSociety]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [removing, setRemoving]     = useState(null);   // userId being removed
  const [refreshing, setRefreshing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // ── Fetch society + members ───────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [societyRes, membersRes] = await Promise.all([
        api.get("/societies/mine"),
        api.get("/societies/members"),
      ]);
      setSociety(societyRes.data.society);
      setMembers(membersRes.data.members);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Copy invite code ──────────────────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(society?.inviteCode || "");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
    toast.success("Invite code copied!");
  };

  // ── Refresh invite code (admin) ───────────────────────────
  const handleRefreshCode = async () => {
    if (!confirm("Refresh invite code? The old code will stop working.")) return;
    setRefreshing(true);
    try {
      const { data } = await api.post("/societies/refresh-code");
      setSociety((s) => ({ ...s, inviteCode: data.inviteCode }));
      toast.success("New invite code generated 🔄");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };

  // ── Remove member (admin) ─────────────────────────────────
  const handleRemove = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from the society?`)) return;
    setRemoving(memberId);
    try {
      await api.delete(`/societies/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      toast.success(`${memberName} has been removed.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-soil-900">
          👥 Members
        </h1>
        <p className="text-soil-500 text-sm mt-0.5">
          {loading ? "Loading…" : `${members.length} resident${members.length !== 1 ? "s" : ""} in your society`}
        </p>
      </div>

      {/* ── Invite code card (all members see, only admin can refresh) ── */}
      <div className="card mb-6 bg-gradient-to-r from-saffron-50 to-soil-50 border-saffron-200">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-soil-500 uppercase tracking-wide mb-1">
              Society Invite Code
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-saffron-700 tracking-widest">
                {society?.inviteCode || "——"}
              </span>
              <button
                onClick={copyCode}
                className="text-xs px-2.5 py-1 bg-white border border-saffron-200 rounded-lg text-saffron-600 hover:bg-saffron-50 transition-colors font-medium"
              >
                {codeCopied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-soil-400 mt-1.5">
              Share this code with residents to let them join.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleRefreshCode}
              disabled={refreshing}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              {refreshing ? (
                <span className="w-3.5 h-3.5 border-2 border-saffron-300 border-t-saffron-600 rounded-full animate-spin" />
              ) : (
                "🔄"
              )}
              Refresh Code
            </button>
          )}
        </div>
      </div>

      {/* ── Members list ────────────────────────────────── */}
      <div className="card">
        <h2 className="font-display font-semibold text-soil-800 mb-1">
          All Members
        </h2>
        <p className="text-xs text-soil-400 mb-4">
          {isAdmin ? "As admin, you can remove members from the society." : ""}
        </p>

        <div className="divide-y divide-saffron-50">
          {loading ? (
            [1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-soil-400">
              <span className="text-3xl block mb-2">👥</span>
              No members found.
            </div>
          ) : (
            members.map((member) => {
              const isCurrentUser = member._id === user?._id;
              const isCreator     = society?.createdBy?._id === member._id ||
                                    society?.createdBy === member._id;
              const initials    = getInitials(member.name);
              const avatarColor = getAvatarColor(member.name);

              return (
                <div
                  key={member._id}
                  className={`flex items-center gap-3 py-3.5 group ${isCurrentUser ? "bg-saffron-50/50 -mx-5 px-5 rounded-xl" : ""}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor}`}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-soil-800 text-sm">
                        {member.name}
                        {isCurrentUser && (
                          <span className="text-soil-400 font-normal ml-1">(you)</span>
                        )}
                      </span>
                      {member.role === "admin" && (
                        <span className="badge-admin">Admin</span>
                      )}
                      {isCreator && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-saffron-100 text-saffron-600 rounded-full font-medium">
                          Founder
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-soil-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{member.email}</span>
                      <span>·</span>
                      <span>Joined {timeAgo(member.createdAt)}</span>
                    </div>
                    {member.bio && (
                      <p className="text-xs text-soil-500 mt-1 italic truncate max-w-xs">
                        "{member.bio}"
                      </p>
                    )}
                  </div>

                  {/* Remove button (admin only, not self, not founder) */}
                  {isAdmin && !isCurrentUser && !isCreator && (
                    <button
                      onClick={() => handleRemove(member._id, member.name)}
                      disabled={removing === member._id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium disabled:opacity-40"
                    >
                      {removing === member._id ? "Removing…" : "Remove"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Society info card ───────────────────────────── */}
      {society && (
        <div className="card mt-4 bg-soil-50/60 border-soil-200">
          <h3 className="text-xs font-semibold text-soil-500 uppercase tracking-wide mb-3">
            Society Info
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-soil-400 w-20 flex-shrink-0">Name</span>
              <span className="font-medium text-soil-800">{society.name}</span>
            </div>
            {society.address && (
              <div className="flex items-start gap-2">
                <span className="text-soil-400 w-20 flex-shrink-0">Address</span>
                <span className="text-soil-700">{society.address}</span>
              </div>
            )}
            {society.description && (
              <div className="flex items-start gap-2">
                <span className="text-soil-400 w-20 flex-shrink-0">About</span>
                <span className="text-soil-700">{society.description}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="text-soil-400 w-20 flex-shrink-0">Founded</span>
              <span className="text-soil-700">{timeAgo(society.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
