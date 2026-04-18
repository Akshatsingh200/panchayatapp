/**
 * routes/authRoutes.js
 * POST /api/auth/signup  — register a new user
 * POST /api/auth/login   — authenticate user, return JWT
 * GET  /api/auth/me      — get current user profile
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { verifyJWT } = require("../middleware/authMiddleware");

// ── Helper: generate JWT ───────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ── POST /api/auth/signup ─────────────────────────────────────
router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;

      // Check duplicate email
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "Email already registered." });
      }

      // Create user (password hashed in pre-save hook)
      const user = await User.create({ name, email, password });

      const token = generateToken(user._id);

      res.status(201).json({
        message: "Account created successfully",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          societyId: user.societyId,
        },
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Signup failed. Please try again." });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Select password explicitly (it's excluded by default)
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const token = generateToken(user._id);

      res.json({
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          societyId: user.societyId,
          bio: user.bio,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────
router.get("/me", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "societyId",
      "name inviteCode"
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile." });
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put(
  "/profile",
  verifyJWT,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("bio")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Bio cannot exceed 200 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, bio } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (bio !== undefined) updates.bio = bio;

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({ message: "Profile updated", user });
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile." });
    }
  }
);

module.exports = router;
