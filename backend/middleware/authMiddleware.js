/**
 * middleware/authMiddleware.js
 * verifyJWT       — validates Bearer token, attaches req.user
 * verifySocietyAccess — ensures user has a societyId before accessing society-scoped routes
 * verifyAdmin     — ensures user has admin role
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── verifyJWT ─────────────────────────────────────────────────
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided. Access denied." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Fetch user from DB to ensure they still exist and have current role/societyId
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user; // Attach full user object to request
    next();
  } catch (error) {
    console.error("verifyJWT error:", error);
    return res.status(500).json({ message: "Authentication error." });
  }
};

// ── verifySocietyAccess ───────────────────────────────────────
// Called AFTER verifyJWT. Ensures user belongs to a society before
// accessing any society-scoped data. This prevents cross-tenant access.
const verifySocietyAccess = (req, res, next) => {
  if (!req.user.societyId) {
    return res.status(403).json({
      message: "You have not joined or created a society yet. Please set up your society first.",
    });
  }
  next();
};

// ── verifyAdmin ───────────────────────────────────────────────
// Ensures only admins can perform privileged actions
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

module.exports = { verifyJWT, verifySocietyAccess, verifyAdmin };
