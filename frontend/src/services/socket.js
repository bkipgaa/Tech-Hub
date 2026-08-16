import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

/**
 * initSocket(token)
 * -----------------
 * Creates or returns the singleton socket.
 */
export const initSocket = (token) => {
  currentToken = token;

  if (!socket) {
    // Vite uses import.meta.env, NOT process.env
    // Strip '/api' from the end because Socket.IO mounts at root, not /api
    const baseURL = (import.meta.env.VITE_API_URL || 'https://tech-hub-backend-ecno.onrender.com')
      .replace(/\/api\/?$/, '');

    socket = io(baseURL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      if (currentToken) {
        socket.emit('authenticate', currentToken);
      }
    });

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