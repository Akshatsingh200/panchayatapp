/**
 * socket/socketHandlers.js
 * Manages Socket.IO events for real-time group chat.
 * Users join a "room" named after their societyId — ensuring
 * complete isolation between societies at the socket level.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

module.exports = function registerSocketHandlers(io) {
  // ── Socket Auth Middleware ─────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) return next(new Error("User not found"));

      socket.user = user; // Attach user to socket
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.name} [${user._id}]`);

    // ── Join society room ────────────────────────────────────
    // Room is named by societyId — only members of same society communicate
    if (user.societyId) {
      const room = user.societyId.toString();
      socket.join(room);
      console.log(`   → Joined room: ${room}`);

      // Notify others that a member came online
      socket.to(room).emit("memberOnline", {
        userId: user._id,
        name: user.name,
      });
    }

    // ── Send group message via socket ────────────────────────
    // Frontend can emit directly; we also persist to DB here
    socket.on("sendGroupMessage", async ({ text }) => {
      if (!user.societyId || !text?.trim()) return;

      try {
        const message = await Message.create({
          text: text.trim().slice(0, 500),
          societyId: user.societyId,
          userId: user._id,
          senderName: user.name,
          chatType: "group",
        });

        const populated = await Message.findById(message._id).populate("userId", "name role");

        // Broadcast to everyone in the society room (including sender)
        io.to(user.societyId.toString()).emit("newGroupMessage", populated);
      } catch (err) {
        socket.emit("socketError", { message: "Failed to send message." });
      }
    });

    // ── Typing indicator ─────────────────────────────────────
    socket.on("typing", () => {
      if (!user.societyId) return;
      socket.to(user.societyId.toString()).emit("userTyping", {
        userId: user._id,
        name: user.name,
      });
    });

    socket.on("stopTyping", () => {
      if (!user.societyId) return;
      socket.to(user.societyId.toString()).emit("userStoppedTyping", {
        userId: user._id,
      });
    });

    // ── Disconnect ───────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${user.name}`);
      if (user.societyId) {
        socket.to(user.societyId.toString()).emit("memberOffline", {
          userId: user._id,
          name: user.name,
        });
      }
    });
  });
};
