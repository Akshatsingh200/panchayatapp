/**
 * routes/messageRoutes.js
 * GET /api/messages/group   — fetch last 50 group chat messages for user's society
 * POST /api/messages/group  — save a group message (also emitted via socket)
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");
const { verifyJWT, verifySocietyAccess } = require("../middleware/authMiddleware");

router.use(verifyJWT, verifySocietyAccess);

// ── GET /api/messages/group ────────────────────────────────────
router.get("/group", async (req, res) => {
  try {
    const messages = await Message.find({
      societyId: req.user.societyId,
      chatType: "group",
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate("userId", "name role")
      .lean();

    res.json({ messages: messages.reverse() }); // Oldest first for display
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages." });
  }
});

// ── POST /api/messages/group ───────────────────────────────────
router.post(
  "/group",
  [body("text").trim().notEmpty().withMessage("Message cannot be empty").isLength({ max: 500 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const message = await Message.create({
        text: req.body.text,
        societyId: req.user.societyId,
        userId: req.user._id,
        senderName: req.user.name,
        chatType: "group",
      });

      const populated = await Message.findById(message._id).populate("userId", "name role");

      // Emit to all users in the society room
      req.io.to(req.user.societyId.toString()).emit("newGroupMessage", populated);

      res.status(201).json({ message: populated });
    } catch (err) {
      res.status(500).json({ message: "Failed to send message." });
    }
  }
);

module.exports = router;
