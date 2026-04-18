/**
 * routes/societyRoutes.js
 * POST /api/societies/create     — create a new society (user becomes admin)
 * POST /api/societies/join       — join via inviteCode
 * GET  /api/societies/mine       — get current user's society info
 * GET  /api/societies/members    — list all society members (admin)
 * POST /api/societies/refresh-code — regenerate invite code (admin)
 * DELETE /api/societies/members/:userId — remove a member (admin)
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Society = require("../models/Society");
const User = require("../models/User");
const {
  verifyJWT,
  verifySocietyAccess,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// ── POST /api/societies/create ────────────────────────────────
router.post(
  "/create",
  verifyJWT,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Society name is required")
      .isLength({ max: 100 })
      .withMessage("Name too long"),
    body("description").optional().trim().isLength({ max: 300 }),
    body("address").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // A user can only belong to one society at a time
      if (req.user.societyId) {
        return res.status(400).json({
          message: "You are already a member of a society. Leave it first.",
        });
      }

      const { name, description, address } = req.body;

      // Create the society
      const society = await Society.create({
        name,
        description,
        address,
        createdBy: req.user._id,
        members: [req.user._id],
      });

      // Promote the creator to admin and link society
      await User.findByIdAndUpdate(req.user._id, {
        societyId: society._id,
        role: "admin",
      });

      res.status(201).json({
        message: `Society "${society.name}" created! Share the invite code with residents.`,
        society: {
          _id: society._id,
          name: society.name,
          inviteCode: society.inviteCode,
          description: society.description,
        },
      });
    } catch (err) {
      console.error("Create society error:", err);
      res.status(500).json({ message: "Failed to create society." });
    }
  }
);

// ── POST /api/societies/join ──────────────────────────────────
router.post(
  "/join",
  verifyJWT,
  [body("inviteCode").trim().notEmpty().withMessage("Invite code is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (req.user.societyId) {
        return res.status(400).json({
          message: "You are already a member of a society.",
        });
      }

      const { inviteCode } = req.body;
      const society = await Society.findOne({
        inviteCode: inviteCode.toUpperCase(),
      });

      if (!society) {
        return res.status(404).json({ message: "Invalid invite code. Please check and try again." });
      }

      // Add user to society
      society.members.push(req.user._id);
      await society.save();

      await User.findByIdAndUpdate(req.user._id, {
        societyId: society._id,
        role: "member",
      });

      res.json({
        message: `Welcome to ${society.name}! You are now a member.`,
        society: {
          _id: society._id,
          name: society.name,
          description: society.description,
        },
      });
    } catch (err) {
      console.error("Join society error:", err);
      res.status(500).json({ message: "Failed to join society." });
    }
  }
);

// ── GET /api/societies/mine ───────────────────────────────────
router.get("/mine", verifyJWT, verifySocietyAccess, async (req, res) => {
  try {
    const society = await Society.findById(req.user.societyId)
      .populate("createdBy", "name email")
      .populate("members", "name email role avatar");

    if (!society) {
      return res.status(404).json({ message: "Society not found." });
    }

    res.json({ society });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch society." });
  }
});

// ── GET /api/societies/members ────────────────────────────────
router.get(
  "/members",
  verifyJWT,
  verifySocietyAccess,
  async (req, res) => {
    try {
      const members = await User.find({
        societyId: req.user.societyId,
      }).select("name email role bio createdAt");

      res.json({ members });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch members." });
    }
  }
);

// ── POST /api/societies/refresh-code ─────────────────────────
router.post(
  "/refresh-code",
  verifyJWT,
  verifySocietyAccess,
  verifyAdmin,
  async (req, res) => {
    try {
      const society = await Society.findById(req.user.societyId);
      if (!society) return res.status(404).json({ message: "Society not found." });

      await society.refreshInviteCode();

      res.json({
        message: "Invite code refreshed successfully.",
        inviteCode: society.inviteCode,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to refresh invite code." });
    }
  }
);

// ── DELETE /api/societies/members/:userId ─────────────────────
router.delete(
  "/members/:userId",
  verifyJWT,
  verifySocietyAccess,
  verifyAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Cannot remove yourself
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ message: "Cannot remove yourself." });
      }

      // Ensure target is in same society
      const targetUser = await User.findOne({
        _id: userId,
        societyId: req.user.societyId,
      });

      if (!targetUser) {
        return res.status(404).json({ message: "Member not found in your society." });
      }

      // Remove from society's member list and clear user's societyId
      await Society.findByIdAndUpdate(req.user.societyId, {
        $pull: { members: userId },
      });
      await User.findByIdAndUpdate(userId, {
        societyId: null,
        role: "member",
      });

      res.json({ message: `${targetUser.name} has been removed from the society.` });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove member." });
    }
  }
);

module.exports = router;
