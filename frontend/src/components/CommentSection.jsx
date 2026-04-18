/**
 * components/CommentSection.jsx
 * Displays comments for a post and allows adding new ones.
 */

import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { timeAgo, getInitials, getAvatarColor, getErrorMessage } from "../utils/helpers";

export default function CommentSection({ postId, socket }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments]   = useState([]);
  const [text, setText]           = useState("");
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);

  // ── Fetch comments ────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/comments/${postId}`);
        setComments(data.comments);
      } catch {
        toast.error("Failed to load comments.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [postId]);

  // ── Real-time new comments via socket ─────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = ({ postId: pid, comment }) => {
      if (pid !== postId) return;
      setComments((prev) =>
        prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]
      );
    };
    socket.on("newComment", handler);
    return () => socket.off("newComment", handler);
  }, [socket, postId]);

  // ── Scroll to bottom on new comment ──────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ── Submit comment ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/comments/${postId}`, { text });
      setText("");
      // Socket will push the comment back via newComment event
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete comment ────────────────────────────────────────
  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="font-display font-semibold text-soil-800 text-base mb-3">
        Comments ({comments.length})
      </h3>

      {/* ── Comment list ──────────────────────────────────── */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-soil-400 text-sm">
            <span className="text-2xl block mb-2">💬</span>
            Be the first to comment!
          </div>
        ) : (
          comments.map((c) => {
            const name = c.userId?.name || "Unknown";
            const isOwn = c.userId?._id === user?._id;
            return (
              <div key={c._id} className="flex gap-3 animate-fade-in group">
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${getAvatarColor(name)}`}
                >
                  {getInitials(name)}
                </div>
                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="bg-saffron-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-soil-800">{name}</span>
                      {c.userId?.role === "admin" && (
                        <span className="badge-admin text-[9px]">Admin</span>
                      )}
                      <span className="text-[10px] text-soil-400 ml-auto">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-soil-700 mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                  {/* Delete */}
                  {(isOwn || isAdmin) && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-[10px] text-soil-400 hover:text-red-500 ml-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Add comment ───────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <div
          className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${getAvatarColor(user?.name)}`}
        >
          {getInitials(user?.name)}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="input flex-1 text-sm py-2"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="btn-primary text-sm px-4 py-2"
          >
            {submitting ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
