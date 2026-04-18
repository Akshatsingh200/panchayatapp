/**
 * models/User.js
 * Stores member data. Each user belongs to exactly one society (societyId).
 * Role: "member" | "admin"
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    // ── Multi-Tenant Key ──────────────────────────────────────
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      default: null, // null until they join/create a society
    },
    avatar: {
      type: String,
      default: "", // Can store URL or initials-based avatar label
    },
    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// ── Hash password before save ──────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare plain password with hash ──────────────────────────
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
