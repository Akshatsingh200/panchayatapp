/**
 * pages/Dashboard.jsx
 * Main community feed — shows posts filtered by society, allows creating new ones.
 * Real-time updates via Socket.IO (new posts appear without refresh).
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../utils/socket";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";

const TYPE_FILTERS = [
  { value: "",             label: "All Posts",    emoji: "📋" },
  { value: "help",         label: "Help",         emoji: "🆘" },
  { value: "announcement", label: "Announcements",emoji: "📢" },
  { value: "suggestion",   label: "Suggestions",  emoji: "💡" },
];

// Skeleton card
const SkeletonCard = () => (
  <div className="card">
    <div className="flex gap-3">
      <div className="skeleton w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
    <div className="mt-4 ml-12 space-y-2">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  </div>
);

export default function Dashboard() {
  const { user, token } = useAuth();
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const socketRef = useRef(null);

  // Society name from user object
  const societyName = typeof user?.societyId === "object"
    ? user.societyId?.name
    : "My Society";

  // ── Fetch posts ───────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "latest" });
      if (typeFilter) params.append("type", typeFilter);
      const { data } = await api.get(`/posts?${params}`);
      setPosts(data.posts);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // ── Socket: real-time post updates ────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on("newPost", (post) => {
      setPosts((prev) =>
        prev.some((p) => p._id === post._id)
          ? prev
          : [post, ...prev]
      );
    });

    socket.on("postDeleted", ({ postId }) => {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    });

    return () => {
      socket.off("newPost");
      socket.off("postDeleted");
    };
  }, [token]);

  // ── Post callbacks ────────────────────────────────────────
  const handlePostCreated = (post) => {
    // Socket will broadcast, but add optimistically for instant feedback
    setPosts((prev) => [post, ...prev.filter((p) => p._id !== post._id)]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handlePostUpdated = (updated) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
    );
  };

  return (
    <div className="page-container">
      {/* ── Society header ───────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-soil-900">
              🏘️ {societyName}
            </h1>
            <p className="text-soil-500 text-sm mt-0.5">
              {posts.length} post{posts.length !== 1 ? "s" : ""} in your community
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-lg">✏️</span> New Post
          </button>
        </div>

        {/* ── Filter tabs ────────────────────────────────── */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {TYPE_FILTERS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border
                ${typeFilter === value
                  ? "bg-saffron-500 text-white border-saffron-500 shadow-sm"
                  : "bg-white text-soil-600 border-saffron-200 hover:border-saffron-300 hover:text-saffron-600"
                }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Posts feed ──────────────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : posts.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">
              {typeFilter === "help" ? "🆘" : typeFilter === "announcement" ? "📢" : typeFilter === "suggestion" ? "💡" : "📋"}
            </div>
            <h3 className="font-display text-lg font-semibold text-soil-700 mb-2">
              No {typeFilter || ""} posts yet
            </h3>
            <p className="text-soil-500 text-sm mb-5">
              Be the first to post something for your community!
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              Create First Post
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handlePostDeleted}
              onUpdate={handlePostUpdated}
            />
          ))
        )}
      </div>

      {/* ── Floating action button (mobile) ─────────────── */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-saffron-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-saffron-600 transition-colors active:scale-95"
        aria-label="New post"
      >
        ✏️
      </button>

      {/* ── Create post modal ────────────────────────────── */}
      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
