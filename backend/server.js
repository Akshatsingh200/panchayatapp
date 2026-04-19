/**
 * server.js — Society Connect Entry Point
 * Sets up Express, Mongoose, Socket.IO, and all routes.
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// ── Route Imports ──────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const societyRoutes = require("./routes/societyRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const messageRoutes = require("./routes/messageRoutes");

// ── Socket Handler Import ──────────────────────────────────────
const registerSocketHandlers = require("./socket/socketHandlers");

const app = express();
const httpServer = http.createServer(app);

// ── Socket.IO Setup ────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in routes via req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── Middleware ─────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/messages", messageRoutes);

// ── Health Check ───────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Society Connect API is running" });
});

// ── Global Error Handler ───────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ── Socket.IO Event Registration ──────────────────────────────
registerSocketHandlers(io);

// ── MongoDB Connection + Server Start ─────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/society-connect";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    httpServer.listen(PORT, () => {
      console.log(`🚀 Society Connect server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
