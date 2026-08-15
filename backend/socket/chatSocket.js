const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

/**
 * ACTIVE USERS MAP
 * ================
 * In-memory registry of currently online users.
 * Key = MongoDB userId (string)
 * Value = Socket.io socket.id
 * 
 * This lets us emit events directly to a specific user's socket
 * even if they're not currently inside the conversation room.
 */
const activeUsers = new Map();

module.exports = (io) => {
  
  // ─── CONNECTION HANDLER ───────────────────────
  // Fires every time a client opens the app (or refreshes).
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // ===========================================
    // AUTHENTICATE
    // ===========================================
    /**
     * Clients must emit 'authenticate' with their JWT token
     * immediately after connecting. Until then, socket.userId is null
     * and most events are rejected.
     * 
     * On success:
     *  - socket.userId is set
     *  - user added to activeUsers map
     *  - socket joins a personal room "user:<id>" for direct pushes
     */
    socket.on('authenticate', async (token) => {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        socket.userId = userId;
        activeUsers.set(userId.toString(), socket.id);
        
        // Personal room: used to push inbox updates even when user
        // is browsing another page (not inside a conversation room).
        socket.join(`user:${userId}`);
        
        // Tell everyone else this user is now online (green dot).
        socket.broadcast.emit('user_online', { userId });
        
        console.log(`✅ User ${userId} authenticated on socket ${socket.id}`);
      } catch (err) {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    // ===========================================
    // JOIN / LEAVE CONVERSATION ROOM
    // ===========================================
    /**
     * When user opens a specific chat, they join that conversation's
     * room. This means they receive real-time messages for THIS chat
     * without getting flooded by messages from other chats.
     */
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`📥 Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ===========================================
    // SEND MESSAGE (REAL-TIME CORE)
    // ===========================================
    /**
     * The heart of the chat system.
     * 
     * Flow:
     *  1. Validate sender is authenticated.
     *  2. Verify sender belongs to the target conversation.
     *  3. Persist message to MongoDB.
     *  4. Update conversation preview + unread count.
     *  5. EMIT to conversation room (both sender & receiver see it instantly).
     *  6. EMIT to receiver's personal room (inbox badge update).
     *  7. ACK to sender (shows checkmark, clears "sending..." spinner).
     */
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', media, replyTo } = data;
        const senderId = socket.userId;

        if (!senderId) {
          return socket.emit('error', { message: 'Not authenticated' });
        }

        // ─── AUTHORIZATION ──────────────────────────
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.user': senderId,
          status: 'active'
        });
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Identify the receiver (the OTHER participant).
        const receiverParticipant = conversation.participants.find(
          p => p.user.toString() !== senderId
        );
        const receiverId = receiverParticipant?.user;

        // ─── PERSIST ────────────────────────────────
        const message = new Message({
          conversation: conversationId,
          sender: senderId,
          receiver: receiverId,
          content: content?.trim() || '',
          messageType,
          media: media || undefined,
          replyTo: replyTo || undefined,
          deliveredAt: new Date()
        });
        await message.save();

        // ─── UPDATE CONVERSATION ────────────────────
        const otherIndex = conversation.participants.findIndex(
          p => p.user.toString() !== senderId
        );
        if (otherIndex !== -1) {
          conversation.participants[otherIndex].unreadCount += 1;
        }
        conversation.lastMessage = {
          content: content?.trim() || 'Sent an attachment',
          sender: senderId,
          sentAt: new Date(),
          messageType
        };
        conversation.updatedAt = new Date();
        await conversation.save();

        // Populate sender info so the frontend can show avatar/name immediately.
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'firstName lastName profileImage')
          .lean();

        // ─── BROADCAST ──────────────────────────────
        // 1. Everyone in this conversation room gets the new bubble.
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message: populatedMessage,
          conversationId
        });

        // 2. Receiver gets an inbox update (for the sidebar badge/preview)
        //    even if they're not currently inside this conversation.
        io.to(`user:${receiverId}`).emit('conversation_updated', {
          conversationId,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.participants[otherIndex].unreadCount
        });

        // 3. Sender gets confirmation so UI can swap "sending..." for checkmark.
        socket.emit('message_sent', { message: populatedMessage });
      } catch (error) {
        console.error('Socket send_message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ===========================================
    // TYPING INDICATOR
    // ===========================================
    /**
     * When user starts typing, we broadcast to the conversation room.
     * We use a 2-second debounce on the frontend; if no keystrokes
     * occur within 2s, frontend emits typing:false automatically.
     */
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        userId: socket.userId,
        conversationId,
        isTyping
      });
    });

    // ===========================================
    // MARK AS READ
    // ===========================================
    /**
     * Triggered when user opens a chat or scrolls to bottom.
     * Updates DB read status, then notifies the OTHER party
     * so their UI can turn single-check into blue double-check.
     */
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        const userId = socket.userId;
        
        await Message.updateMany(
          { conversation: conversationId, receiver: userId, readAt: null },
          { readAt: new Date() }
        );
        await Conversation.updateOne(
          { _id: conversationId, 'participants.user': userId },
          { $set: { 'participants.$.unreadCount': 0 } }
        );

        // Tell the sender their messages were seen.
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          by: userId,
          conversationId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // ===========================================
    // DISCONNECT
    // ===========================================
    /**
     * Clean up activeUsers map and broadcast offline status
     * so other users see the grey dot instead of green.
     */
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
      if (socket.userId) {
        activeUsers.delete(socket.userId.toString());
        io.emit('user_offline', { userId: socket.userId });
      }
    });
  });
};

// ─── EXPORT HELPERS ─────────────────────────────
// Used by other modules (e.g. push notification service) to check presence.
module.exports.isUserOnline = (userId) => activeUsers.has(userId.toString());
module.exports.getUserSocketId = (userId) => activeUsers.get(userId.toString());