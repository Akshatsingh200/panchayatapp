/**
 * utils/socket.js
 * Socket.IO client singleton — initialized once with the JWT,
 * then reused across the app to avoid duplicate connections.
 */

import { io } from "socket.io-client";

let socket = null;

export const getSocket = (token) => {
  if (!socket || !socket.connected) {
    socket = io("/", {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
