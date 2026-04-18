/**
 * models/Post.js
 * Community posts (help requests, announcements, suggestions).
 * societyId is MANDATORY — enforces tenant isolation.
 */

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Post description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: ["help", "announcement", "suggestion"],
      required: [true, "Post type is required"],
    },
    // ── Tenant Key (CRITICAL) ─────────────────────────────────
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true, // Index for fast per-society queries
    },
    // ── Author ────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ── Engagement ────────────────────────────────────────────
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPinned: {
      type: Boolean,
      default: false, // Admins can pin important posts
    },
    isResolved: {
      type: Boolean,
      default: false, // For "help" type posts
    },
  },
  { timestamps: true }
);

// ── Compound index for society-based sorted queries ────────────
postSchema.index({ societyId: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
