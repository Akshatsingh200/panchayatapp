/**
 * models/Message.js
 * Chat messages for society group chat.
 * societyId scopes every message to its tenant.
 */

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    // ── Tenant Key (CRITICAL) ─────────────────────────────────
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    // ── Sender ────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    // ── Chat type: "group" for society-wide or "private" for DM ──
    chatType: {
      type: String,
      enum: ["group", "private"],
      default: "group",
    },
    // ── For private messages: target userId ───────────────────
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ── Index for efficient group chat fetch ───────────────────────
messageSchema.index({ societyId: 1, chatType: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
