import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

/**
 * initSocket(token)
 * -----------------
 * Creates or returns the singleton socket.
 * Sets up reconnection logic so the user re-authenticates
 * automatically after every reconnect (network blip, server restart).
 */
export const initSocket = (token) => {
  currentToken = token;

  if (!socket) {
    // Use the same base URL as your API to avoid CORS mismatches
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    socket = io(baseURL, {
      transports: ['websocket', 'polling'], // Fallback for strict firewalls
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // Authenticate on initial connect
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      if (currentToken) {
        socket.emit('authenticate', currentToken);
      }
    });

    // Auto-reauthenticate after every reconnect
    socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      if (currentToken) {
        socket.emit('authenticate', currentToken);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });
  }

  return socket;
};

export const getSocket = () => socket;

/**
 * updateSocketToken(token)
 * ------------------------
 * Call this after login/token refresh to update the token
 * used during reconnections.
 */
export const updateSocketToken = (token) => {
  currentToken = token;
  if (socket?.connected && token) {
    socket.emit('authenticate', token);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};