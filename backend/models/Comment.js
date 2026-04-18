/**
 * models/Comment.js
 * Comments on posts. Both postId AND societyId are stored for
 * efficient tenant-scoped queries without joins.
 */

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    // ── Parent post ───────────────────────────────────────────
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    // ── Tenant Key (CRITICAL) ─────────────────────────────────
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    // ── Author ────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ── Fast lookup: all comments for a post within a society ──────
commentSchema.index({ postId: 1, societyId: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
