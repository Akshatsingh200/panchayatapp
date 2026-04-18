/**
 * components/CreatePostModal.jsx
 * Modal form for creating a new community post.
 */

import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";

const TYPE_OPTIONS = [
  { value: "help",         label: "Help Request",  emoji: "🆘", desc: "Need assistance with something?" },
  { value: "announcement", label: "Announcement",  emoji: "📢", desc: "Share important news with everyone" },
  { value: "suggestion",   label: "Suggestion",    emoji: "💡", desc: "Propose an idea for the society" },
];

export default function CreatePostModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title:       "",
    description: "",
    type:        "help",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/posts", form);
      toast.success("Post published! 🎉");
      onCreated?.(data.post);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ── Backdrop ─────────────────────────────────────────── */
    <div
      className="fixed inset-0 bg-soil-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-saffron-100">
          <h2 className="font-display text-xl font-bold text-soil-900">New Post</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-saffron-50 text-soil-400 hover:text-soil-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="label">Post Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(({ value, label, emoji, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-150
                    ${form.type === value
                      ? "border-saffron-400 bg-saffron-50 shadow-sm"
                      : "border-saffron-100 hover:border-saffron-300 hover:bg-saffron-50/50"
                    }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-xs font-semibold text-soil-700">{label}</span>
                  <span className="text-[10px] text-soil-400 leading-tight hidden sm:block">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              className="input"
              placeholder="What's this about?"
              value={form.title}
              onChange={handleChange}
              maxLength={120}
              required
            />
            <div className="text-right text-xs text-soil-400 mt-1">{form.title.length}/120</div>
          </div>

          {/* Description */}
          <div>
            <label className="label" htmlFor="description">Details</label>
            <textarea
              id="description"
              name="description"
              className="input resize-none"
              placeholder="Provide more context..."
              rows={4}
              value={form.description}
              onChange={handleChange}
              maxLength={1000}
              required
            />
            <div className="text-right text-xs text-soil-400 mt-1">{form.description.length}/1000</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Publishing…
                </span>
              ) : (
                "Publish Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
