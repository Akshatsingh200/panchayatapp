/**
 * components/PostCard.jsx
 * Displays a single post with type badge, author, likes, and action buttons.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { timeAgo, getInitials, getAvatarColor, POST_TYPE_META, getErrorMessage } from "../utils/helpers";

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user, isAdmin } = useAuth();
  const [liked, setLiked]           = useState(post.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [pinning, setPinning]       = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const meta      = POST_TYPE_META[post.type] || POST_TYPE_META.suggestion;
  const isAuthor  = post.userId?._id === user?._id;
  const authorName = post.userId?.name || "Unknown";
  const initials   = getInitials(authorName);
  const avatarColor = getAvatarColor(authorName);

  // ── Toggle like ───────────────────────────────────────────
  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount((c) => liked ? c - 1 : c + 1);
    try {
      await api.put(`/posts/${post._id}/like`);
    } catch {
      setLiked(liked);
      setLikesCount((c) => liked ? c + 1 : c - 1);
    }
  };

  // ── Pin post (admin) ──────────────────────────────────────
  const handlePin = async () => {
    setPinning(true);
    try {
      const { data } = await api.put(`/posts/${post._id}/pin`);
      onUpdate?.({ ...post, isPinned: data.isPinned });
      toast.success(data.isPinned ? "Post pinned 📌" : "Post unpinned");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPinning(false);
    }
  };

  // ── Delete post ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted");
      onDelete?.(post._id);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  };

  // ── Resolve help post ─────────────────────────────────────
  const handleResolve = async () => {
    try {
      const { data } = await api.put(`/posts/${post._id}/resolve`);
      onUpdate?.({ ...post, isResolved: data.isResolved });
      toast.success(data.isResolved ? "Marked as resolved ✅" : "Marked as open");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <article className={`card animate-fade-in ${post.isPinned ? "border-saffron-300 bg-saffron-50/60" : ""}`}>
      {/* ── Pinned banner ───────────────────────────────── */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 text-xs text-saffron-600 font-semibold mb-3 -mt-1">
          <span>📌</span> Pinned by Admin
        </div>
      )}

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${avatarColor}`}>
            {initials}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-soil-800 text-sm">{authorName}</span>
              {post.userId?.role === "admin" && (
                <span className="badge-admin">Admin</span>
              )}
              <span className="text-xs text-soil-400">{timeAgo(post.createdAt)}</span>
            </div>
            {/* Type badge */}
            <span className={meta.className}>
              {meta.emoji} {meta.label}
            </span>
          </div>
        </div>

        {/* ── Resolved badge ───────────────────────────── */}
        {post.type === "help" && post.isResolved && (
          <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 bg-leaf-100 text-leaf-700 rounded-full border border-leaf-200">
            ✅ Resolved
          </span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="mt-3 ml-12">
        <Link to={`/posts/${post._id}`} className="group">
          <h3 className="font-display font-semibold text-soil-900 text-base group-hover:text-saffron-700 transition-colors leading-snug">
            {post.title}
          </h3>
        </Link>
        <p className="mt-1.5 text-sm text-soil-600 leading-relaxed line-clamp-3">
          {post.description}
        </p>
      </div>

      {/* ── Actions ─────────────────────────────────────── */}
      <div className="mt-4 ml-12 flex items-center gap-1 flex-wrap">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-150
            ${liked
              ? "text-saffron-600 bg-saffron-50 font-medium"
              : "text-soil-500 hover:text-saffron-500 hover:bg-saffron-50"
            }`}
        >
          {liked ? "🧡" : "🤍"} {likesCount}
        </button>

        {/* Comments count */}
        <Link
          to={`/posts/${post._id}`}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-soil-500 hover:text-saffron-500 hover:bg-saffron-50 transition-all"
        >
          💬 Comment
        </Link>

        {/* Resolve (author or admin, help posts only) */}
        {post.type === "help" && (isAuthor || isAdmin) && (
          <button
            onClick={handleResolve}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-leaf-600 hover:bg-leaf-50 transition-all"
          >
            {post.isResolved ? "🔄 Reopen" : "✅ Resolve"}
          </button>
        )}

        {/* Pin (admin only) */}
        {isAdmin && (
          <button
            onClick={handlePin}
            disabled={pinning}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-soil-500 hover:text-saffron-600 hover:bg-saffron-50 transition-all disabled:opacity-50"
          >
            📌 {post.isPinned ? "Unpin" : "Pin"}
          </button>
        )}

        {/* Delete (author or admin) */}
        {(isAuthor || isAdmin) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 ml-auto"
          >
            🗑️
          </button>
        )}
      </div>
    </article>
  );
}
