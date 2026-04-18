/**
 * utils/helpers.js
 * Shared utility functions used across the frontend.
 */

import { formatDistanceToNow, format } from "date-fns";

/** Format date as "2 hours ago" */
export const timeAgo = (dateStr) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
};

/** Format date as "Apr 14, 2025 · 3:40 PM" */
export const fullDate = (dateStr) => {
  try {
    return format(new Date(dateStr), "MMM d, yyyy · h:mm a");
  } catch {
    return "";
  }
};

/** Generate initials-based avatar label from a name */
export const getInitials = (name = "") =>
  name
    .trim()
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

/** Tailwind color classes for avatars (rotates by index) */
const AVATAR_COLORS = [
  "bg-saffron-200 text-saffron-800",
  "bg-leaf-200 text-leaf-800",
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-soil-200 text-soil-800",
];

export const getAvatarColor = (name = "") => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

/** Extract error message from axios error */
export const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.errors?.[0]?.msg ||
  err?.message ||
  "Something went wrong";

/** Post type meta */
export const POST_TYPE_META = {
  help: {
    label: "Help",
    emoji: "🆘",
    className: "badge-help",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  announcement: {
    label: "Announcement",
    emoji: "📢",
    className: "badge-announcement",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  suggestion: {
    label: "Suggestion",
    emoji: "💡",
    className: "badge-suggestion",
    bg: "bg-leaf-50",
    border: "border-leaf-200",
  },
};
