/**
 * pages/Chat.jsx
 * Society group chat page — wraps the ChatBox component.
 */

import React from "react";
import { useAuth } from "../context/AuthContext";
import ChatBox from "../components/ChatBox";

export default function Chat() {
  const { user } = useAuth();

  const societyName =
    typeof user?.societyId === "object"
      ? user.societyId?.name
      : "Your Society";

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-saffron-100 rounded-xl flex items-center justify-center text-xl">
          💬
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-soil-900">
            Community Chat
          </h1>
          <p className="text-xs text-soil-500">{societyName} · Group Chat</p>
        </div>

        {/* Online dot */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-leaf-600 bg-leaf-50 border border-leaf-100 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-leaf-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Chat box */}
      <div className="card">
        <ChatBox />
      </div>

      {/* Info note */}
      <p className="text-center text-xs text-soil-400 mt-3">
        🔒 Messages are private to your society only
      </p>
    </div>
  );
}
