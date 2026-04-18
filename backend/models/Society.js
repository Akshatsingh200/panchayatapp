/**
 * models/Society.js
 * Root of multi-tenancy. Every piece of data links back to a society via societyId.
 * inviteCode is the unique join key shared with residents.
 */

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const societySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Society name is required"],
      trim: true,
      maxlength: [100, "Society name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    // ── Admin / Creator ───────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ── Invite Code ───────────────────────────────────────────
    // Short unique code residents use to join. Admins can regenerate this.
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().split("-")[0].toUpperCase(), // e.g. "A1B2C3D4"
    },
    // ── Member List ───────────────────────────────────────────
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// ── Regenerate invite code ─────────────────────────────────────
societySchema.methods.refreshInviteCode = function () {
  this.inviteCode = uuidv4().split("-")[0].toUpperCase();
  return this.save();
};

module.exports = mongoose.model("Society", societySchema);
