/**
 * pages/PostDetail.jsx
 * Shows a single post's full detail + comment section.
 */

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../utils/socket";
import api from "../utils/api";
import { timeAgo, getInitials, getAvatarColor, POST_TYPE_META, getErrorMessage, fullDate } from "../utils/helpers";
import CommentSection from "../components/CommentSection";

export default function PostDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user, isAdmin, token } = useAuth();

  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef             = useRef(null);

  // ── Socket for real-time comment pushes ───────────────────
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;
  }, [token]);

  // ── Fetch post ────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/posts/${id}`);
        setPost(data.post);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card animate-pulse">
          <div className="flex gap-3 mb-4">
            <div className="skeleton w-9 h-9 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
          <div className="skeleton h-6 w-2/3 rounded mb-3" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const meta       = POST_TYPE_META[post.type] || POST_TYPE_META.suggestion;
  const authorName = post.userId?.name || "Unknown";
  const isAuthor   = post.userId?._id === user?._id;

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleResolve = async () => {
    try {
      const { data } = await api.put(`/posts/${post._id}/resolve`);
      setPost((p) => ({ ...p, isResolved: data.isResolved }));
      toast.success(data.isResolved ? "Marked resolved ✅" : "Reopened");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="page-container max-w-2xl">
      {/* ── Back ─────────────────────────────────────────── */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-soil-500 hover:text-saffron-600 mb-4 transition-colors"
      >
        ← Back to Feed
      </Link>

      {/* ── Post card ────────────────────────────────────── */}
      <article className="card animate-fade-in">
        {/* Pinned */}
        {post.isPinned && (
          <div className="text-xs text-saffron-600 font-semibold mb-3 flex items-center gap-1.5">
            📌 Pinned post
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getAvatarColor(authorName)}`}>
              {getInitials(authorName)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-soil-800">{authorName}</span>
                {post.userId?.role === "admin" && (
                  <span className="badge-admin">Admin</span>
                )}
              </div>
              <div className="text-xs text-soil-400 mt-0.5">{fullDate(post.createdAt)}</div>
            </div>
          </div>
          <span className={meta.className}>
            {meta.emoji} {meta.label}
          </span>
        </div>

        {/* Content */}
        <div className="mt-4">
          <h1 className="font-display text-xl font-bold text-soil-900 leading-snug">
            {post.title}
          </h1>
          {post.type === "help" && (
            <div className="mt-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  post.isResolved
                    ? "bg-leaf-100 text-leaf-700 border border-leaf-200"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {post.isResolved ? "✅ Resolved" : "🔴 Open — Needs Help"}
              </span>
            </div>
          )}
          <p className="mt-3 text-soil-700 leading-relaxed whitespace-pre-wrap">{post.description}</p>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-4 border-t border-saffron-100 flex items-center gap-2 flex-wrap">
          {post.type === "help" && (isAuthor || isAdmin) && (
            <button onClick={handleResolve} className="btn-secondary text-sm">
              {post.isResolved ? "🔄 Reopen" : "✅ Mark Resolved"}
            </button>
          )}
          {(isAuthor || isAdmin) && (
            <button onClick={handleDelete} className="btn-ghost text-red-500 hover:bg-red-50 text-sm">
              🗑️ Delete Post
            </button>
          )}
        </div>
      </article>

      {/* ── Comments ─────────────────────────────────────── */}
      <div className="card mt-4 animate-fade-in">
        <CommentSection postId={id} socket={socketRef.current} />
      </div>
    </div>
  );
}
