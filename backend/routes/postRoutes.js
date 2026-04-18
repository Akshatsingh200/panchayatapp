/**
 * routes/postRoutes.js
 * All queries filter by req.user.societyId — cross-tenant access is impossible.
 *
 * GET    /api/posts           — fetch all posts for user's society
 * POST   /api/posts           — create a post
 * GET    /api/posts/:id       — get a single post
 * PUT    /api/posts/:id       — update a post (author only)
 * DELETE /api/posts/:id       — delete a post (author or admin)
 * PUT    /api/posts/:id/like  — toggle like
 * PUT    /api/posts/:id/pin   — toggle pin (admin only)
 * PUT    /api/posts/:id/resolve — toggle resolved (author or admin)
 */

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Post = require("../models/Post");
const {
  verifyJWT,
  verifySocietyAccess,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// Apply JWT + Society check to all post routes
router.use(verifyJWT, verifySocietyAccess);

// ── GET /api/posts ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { type, sort = "latest" } = req.query;
    const filter = { societyId: req.user.societyId }; // ← Tenant isolation

    if (type && ["help", "announcement", "suggestion"].includes(type)) {
      filter.type = type;
    }

    const sortOrder = sort === "oldest" ? { createdAt: 1 } : { isPinned: -1, createdAt: -1 };

    const posts = await Post.find(filter)
      .sort(sortOrder)
      .populate("userId", "name role avatar")
      .lean();

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts." });
  }
});

// ── POST /api/posts ────────────────────────────────────────────
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 120 }),
    body("description").trim().notEmpty().withMessage("Description is required").isLength({ max: 1000 }),
    body("type")
      .isIn(["help", "announcement", "suggestion"])
      .withMessage("Type must be help, announcement, or suggestion"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, type } = req.body;

      const post = await Post.create({
        title,
        description,
        type,
        societyId: req.user.societyId, // Always from token — never from body
        userId: req.user._id,
      });

      const populated = await Post.findById(post._id).populate("userId", "name role avatar");

      // Broadcast to society room via Socket.IO
      req.io.to(req.user.societyId.toString()).emit("newPost", populated);

      res.status(201).json({ message: "Post created successfully", post: populated });
    } catch (err) {
      console.error("Create post error:", err);
      res.status(500).json({ message: "Failed to create post." });
    }
  }
);

// ── GET /api/posts/:id ─────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    // societyId filter prevents cross-tenant access
    const post = await Post.findOne({
      _id: req.params.id,
      societyId: req.user.societyId,
    }).populate("userId", "name role avatar");

    if (!post) return res.status(404).json({ message: "Post not found." });

    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post." });
  }
});

// ── PUT /api/posts/:id ─────────────────────────────────────────
router.put(
  "/:id",
  [
    body("title").optional().trim().notEmpty().isLength({ max: 120 }),
    body("description").optional().trim().notEmpty().isLength({ max: 1000 }),
    body("type").optional().isIn(["help", "announcement", "suggestion"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findOne({
        _id: req.params.id,
        societyId: req.user.societyId,
      });

      if (!post) return res.status(404).json({ message: "Post not found." });

      // Only the author can edit
      if (post.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only edit your own posts." });
      }

      const { title, description, type } = req.body;
      if (title) post.title = title;
      if (description) post.description = description;
      if (type) post.type = type;
      await post.save();

      res.json({ message: "Post updated", post });
    } catch (err) {
      res.status(500).json({ message: "Failed to update post." });
    }
  }
);

// ── DELETE /api/posts/:id ──────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      societyId: req.user.societyId,
    });

    if (!post) return res.status(404).json({ message: "Post not found." });

    const isAuthor = post.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this post." });
    }

    await Post.findByIdAndDelete(post._id);

    req.io.to(req.user.societyId.toString()).emit("postDeleted", { postId: post._id });

    res.json({ message: "Post deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post." });
  }
});

// ── PUT /api/posts/:id/like ────────────────────────────────────
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      societyId: req.user.societyId,
    });

    if (!post) return res.status(404).json({ message: "Post not found." });

    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle like." });
  }
});

// ── PUT /api/posts/:id/pin (admin only) ────────────────────────
router.put("/:id/pin", verifyAdmin, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      societyId: req.user.societyId,
    });

    if (!post) return res.status(404).json({ message: "Post not found." });

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({ message: post.isPinned ? "Post pinned" : "Post unpinned", isPinned: post.isPinned });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle pin." });
  }
});

// ── PUT /api/posts/:id/resolve ─────────────────────────────────
router.put("/:id/resolve", async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      societyId: req.user.societyId,
      type: "help",
    });

    if (!post) return res.status(404).json({ message: "Help post not found." });

    const isAuthor = post.userId.toString() === req.user._id.toString();
    if (!isAuthor && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the author or admin can resolve a post." });
    }

    post.isResolved = !post.isResolved;
    await post.save();

    res.json({ isResolved: post.isResolved });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle resolve." });
  }
});

module.exports = router;
