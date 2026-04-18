/**
 * routes/commentRoutes.js
 * GET    /api/comments/:postId   — fetch comments for a post (society-scoped)
 * POST   /api/comments/:postId   — add a comment
 * DELETE /api/comments/:id       — delete a comment (author or admin)
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const {
  verifyJWT,
  verifySocietyAccess,
} = require("../middleware/authMiddleware");

router.use(verifyJWT, verifySocietyAccess);

// ── GET /api/comments/:postId ──────────────────────────────────
router.get("/:postId", async (req, res) => {
  try {
    // Verify the post exists AND belongs to the user's society
    const postExists = await Post.findOne({
      _id: req.params.postId,
      societyId: req.user.societyId,
    });

    if (!postExists) {
      return res.status(404).json({ message: "Post not found in your society." });
    }

    const comments = await Comment.find({
      postId: req.params.postId,
      societyId: req.user.societyId, // Double-scoped: post + society
    })
      .sort({ createdAt: 1 })
      .populate("userId", "name role avatar");

    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch comments." });
  }
});

// ── POST /api/comments/:postId ─────────────────────────────────
router.post(
  "/:postId",
  [body("text").trim().notEmpty().withMessage("Comment cannot be empty").isLength({ max: 500 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Verify post belongs to same society
      const post = await Post.findOne({
        _id: req.params.postId,
        societyId: req.user.societyId,
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found in your society." });
      }

      const comment = await Comment.create({
        text: req.body.text,
        postId: req.params.postId,
        societyId: req.user.societyId, // Always from token
        userId: req.user._id,
      });

      const populated = await Comment.findById(comment._id).populate(
        "userId",
        "name role avatar"
      );

      // Broadcast new comment to society room
      req.io.to(req.user.societyId.toString()).emit("newComment", {
        postId: req.params.postId,
        comment: populated,
      });

      res.status(201).json({ message: "Comment added", comment: populated });
    } catch (err) {
      res.status(500).json({ message: "Failed to add comment." });
    }
  }
);

// ── DELETE /api/comments/:id ───────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      societyId: req.user.societyId,
    });

    if (!comment) return res.status(404).json({ message: "Comment not found." });

    const isAuthor = comment.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this comment." });
    }

    await Comment.findByIdAndDelete(comment._id);
    res.json({ message: "Comment deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment." });
  }
});

module.exports = router;
