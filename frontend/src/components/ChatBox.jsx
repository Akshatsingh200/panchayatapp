/**
 * components/ChatBox.jsx
 * Real-time society group chat using Socket.IO.
 * Messages are scoped to the society room — complete tenant isolation.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../utils/socket";
import api from "../utils/api";
import { getInitials, getAvatarColor, fullDate } from "../utils/helpers";

export default function ChatBox() {
  const { user, token } = useAuth();
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState("");
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineInfo, setOnlineInfo]   = useState(null);
  const bottomRef   = useRef(null);
  const socketRef   = useRef(null);
  const typingTimer = useRef(null);

  // ── Socket setup ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on("newGroupMessage", (msg) => {
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
    });

    socket.on("userTyping", ({ name }) => {
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    });

    socket.on("userStoppedTyping", ({ userId }) => {
      // Remove from typing by re-fetching — simplified: just clear after delay
      setTimeout(() => setTypingUsers((prev) => prev.slice(1)), 2000);
    });

    socket.on("memberOnline", ({ name }) => {
      setOnlineInfo(`${name} joined`);
      setTimeout(() => setOnlineInfo(null), 3000);
    });

    return () => {
      socket.off("newGroupMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("memberOnline");
    };
  }, [token]);

  // ── Fetch chat history ────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/messages/group");
        setMessages(data.messages);
      } catch {
        toast.error("Could not load chat history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message via socket ───────────────────────────────
  const sendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!text.trim() || !socketRef.current) return;
      setSending(true);
      socketRef.current.emit("sendGroupMessage", { text: text.trim() });
      setText("");
      setSending(false);
    },
    [text]
  );

  // ── Typing indicator ──────────────────────────────────────
  const handleTyping = (e) => {
    setText(e.target.value.slice(0, 500));
    if (!socketRef.current) return;
    socketRef.current.emit("typing");
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit("stopTyping");
    }, 2000);
  };

  // ── Group messages by day ─────────────────────────────────
  const groupedMessages = messages.reduce((groups, msg) => {
    const day = new Date(msg.createdAt).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(msg);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-3 border-saffron-200 border-t-saffron-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[400px]">
      {/* ── Online status bar ──────────────────────────── */}
      {onlineInfo && (
        <div className="text-center text-xs text-leaf-600 bg-leaf-50 border border-leaf-100 rounded-lg px-3 py-1.5 mb-2 animate-fade-in">
          {onlineInfo}
        </div>
      )}

      {/* ── Message list ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto chat-messages space-y-1 pr-1">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-soil-400 gap-2">
            <span className="text-4xl">💬</span>
            <p className="text-sm">No messages yet. Say hello to your neighbors!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([day, dayMessages]) => (
            <div key={day}>
              {/* Day separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-saffron-100" />
                <span className="text-xs text-soil-400 font-medium px-2">{day}</span>
                <div className="flex-1 border-t border-saffron-100" />
              </div>

              {dayMessages.map((msg, idx) => {
                const isOwn = msg.userId?._id === user?._id || msg.userId === user?._id;
                const name  = msg.senderName || msg.userId?.name || "Unknown";
                const showAvatar = idx === 0 || dayMessages[idx - 1]?.userId?._id !== msg.userId?._id;

                return (
                  <div
                    key={msg._id}
                    className={`flex gap-2 mb-1 animate-fade-in ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div className="w-7 flex-shrink-0 flex items-end">
                      {showAvatar && (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(name)}`}
                        >
                          {getInitials(name)}
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      {showAvatar && !isOwn && (
                        <span className="text-[10px] text-soil-500 mb-0.5 ml-1">{name}</span>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                          ${isOwn
                            ? "bg-saffron-500 text-white rounded-br-sm"
                            : "bg-white border border-saffron-100 text-soil-800 rounded-bl-sm shadow-sm"
                          }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-soil-400 mt-0.5 mx-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 ml-9 animate-fade-in">
            <div className="flex gap-1 bg-white border border-saffron-100 px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm">
              <span className="w-1.5 h-1.5 bg-soil-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-soil-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-soil-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-soil-400">{typingUsers.join(", ")} typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ──────────────────────────────────── */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-3 pt-3 border-t border-saffron-100">
        <input
          type="text"
          className="input flex-1 py-2.5 text-sm"
          placeholder="Type a message…"
          value={text}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(e)}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="btn-primary px-4 text-sm"
        >
          <span>Send</span>
          <span className="ml-1.5">➤</span>
        </button>
      </form>
    </div>
  );
}
