/**
 * components/Navbar.jsx
 * Top navigation bar — shows society name, nav links, user avatar & logout.
 */

import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInitials, getAvatarColor } from "../utils/helpers";
import { disconnectSocket } from "../utils/socket";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Feed",    icon: "🏘️" },
    { to: "/chat",      label: "Chat",    icon: "💬" },
    { to: "/members",   label: "Members", icon: "👥" },
  ];

  const societyName = typeof user?.societyId === "object"
    ? user.societyId?.name
    : null;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-saffron-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo + Society Name ──────────────────────── */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-saffron-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-lg">🏡</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-soil-900 font-bold text-lg leading-none">
                Society Connect
              </div>
              {societyName && (
                <div className="text-xs text-saffron-600 font-medium mt-0.5 truncate max-w-[160px]">
                  {societyName}
                </div>
              )}
            </div>
          </Link>

          {/* ── Desktop Nav Links ────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? "bg-saffron-50 text-saffron-700"
                    : "text-soil-600 hover:text-saffron-600 hover:bg-saffron-50"
                  }`
                }
              >
                <span>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── User Menu ────────────────────────────────── */}
          <div className="flex items-center gap-2">
            {/* Profile button */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-saffron-50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(user?.name)}`}
                >
                  {getInitials(user?.name)}
                </div>
                <span className="hidden sm:block text-sm font-medium text-soil-700 max-w-[100px] truncate">
                  {user?.name}
                </span>
                {isAdmin && (
                  <span className="hidden sm:block badge-admin text-[10px]">Admin</span>
                )}
                <svg className="w-4 h-4 text-soil-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-lg border border-saffron-100 py-2 animate-fade-in z-50"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-soil-700 hover:bg-saffron-50 hover:text-saffron-700 transition-colors"
                  >
                    <span>👤</span> Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/members"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-soil-700 hover:bg-saffron-50 hover:text-saffron-700 transition-colors"
                    >
                      <span>⚙️</span> Manage Members
                    </Link>
                  )}
                  <div className="divider my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Nav ───────────────────────────────────── */}
        <div className="md:hidden flex border-t border-saffron-100 -mx-4 px-2 py-1.5 gap-1">
          {navLinks.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-all
                ${isActive ? "text-saffron-600 bg-saffron-50" : "text-soil-500 hover:text-saffron-500"}`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-all
              ${isActive ? "text-saffron-600 bg-saffron-50" : "text-soil-500 hover:text-saffron-500"}`
            }
          >
            <span className="text-base">👤</span>
            You
          </NavLink>
        </div>
      </div>
    </header>
  );
}
