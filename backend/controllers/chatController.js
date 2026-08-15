const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Technician = require('../models/Technician');
const mongoose = require('mongoose'); // ← ADD THIS


// ===========================================
// GET /api/chat/conversations
// ===========================================
/**
 * Fetches the inbox list for the logged-in user.
 * 
 * We populate nested references (user data, technician profile)
 * then reshape the raw MongoDB document into a flat "enriched"
 * object that the frontend inbox can render directly.
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find every conversation where this user appears in the participants array.
    // We exclude 'blocked' threads so users don't see harassers.
    const conversations = await Conversation.find({
      'participants.user': userId,
      status: { $ne: 'blocked' }
    })
    .populate('participants.user', 'firstName lastName profileImage')   // Fill user names/avatars
    .populate('technicianProfile', 'profileHeadline mainCategory')      // Fill trade info
    .populate('lastMessage.sender', 'firstName lastName')               // Fill "You:" or name
    .sort({ updatedAt: -1 })   // Most recent activity first
    .lean();                   // Return plain JS objects (faster, less memory)

    // Transform MongoDB shape into frontend-friendly shape.
    // We extract "me" vs "other party" so the UI knows whose avatar/name to show.
    const enriched = conversations.map(conv => {
      const myParticipant = conv.participants.find(p => 
        p.user._id.toString() === userId
      );
      const otherParticipant = conv.participants.find(p => 
        p.user._id.toString() !== userId
      );
      
      return {
        _id: conv._id,
        otherParty: otherParticipant?.user || null,   // Avatar + name for inbox row
        myRole: myParticipant?.role || 'client',
        unreadCount: myParticipant?.unreadCount || 0, // Red badge number
        lastMessage: conv.lastMessage,                  // Preview text + timestamp
        technicianProfile: conv.technicianProfile,
        status: conv.status,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// GET /api/chat/conversations/:id/messages
// ===========================================
/**
 * Paginated message history for a single conversation.
 * 
 * SECURITY: We verify the requesting user is actually IN the conversation
 * before returning any messages (prevents ID guessing attacks).
 * 
 * SIDE EFFECT: Automatically marks messages as read when fetched,
 * so opening the chat clears the unread badge.
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100); // Cap at 100/msg
    const skip = (page - 1) * limit;

    // ─── AUTHORIZATION CHECK ──────────────────────
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // ─── FETCH MESSAGES ───────────────────────────
    // Sort DESC (newest first) so skip/limit grabs the latest page,
    // then we reverse() to chronological order before sending.
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .populate('sender', 'firstName lastName profileImage')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // ─── MARK AS READ ─────────────────────────────
    // Any message where I am the receiver and readAt is null → now read.
    await Message.updateMany(
      { conversation: conversationId, receiver: userId, readAt: null },
      { readAt: new Date() }
    );
    // Reset my unread counter on the conversation document.
    await Conversation.updateOne(
      { _id: conversationId, 'participants.user': userId },
      { $set: { 'participants.$.unreadCount': 0 } }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Oldest → newest for chat bubble rendering
      pagination: { page, limit, hasMore: messages.length === limit }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// POST /api/chat/conversations
// ===========================================
/**
 * START CHAT — Called when a client clicks "Message" on a technician profile.
 * 
 * Idempotent: if a conversation already exists between this client
 * and technician, we return the existing one (no duplicates).
 * 
 * Optionally sends an initial greeting message so the technician
 * inbox isn't empty.
 */
exports.createConversation = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const { technicianUserId, technicianProfileId, initialMessage } = req.body;

    if (!technicianUserId) {
      return res.status(400).json({ success: false, message: 'technicianUserId required' });
    }

    // ─── CHECK EXISTING ───────────────────────────
    let conversation = await Conversation.findOne({
      client: clientId,
      technician: technicianUserId
    });
    if (conversation) {
      return res.json({ success: true, data: conversation, message: 'Conversation already exists' });
    }

    // ─── VERIFY TECHNICIAN ────────────────────────
    const technician = await Technician.findOne({ userId: technicianUserId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }

    // ─── CREATE THREAD ────────────────────────────
    conversation = new Conversation({
      participants: [
        { user: clientId, role: 'client', unreadCount: 0 },
        { user: technicianUserId, role: 'technician', unreadCount: 0 }
      ],
      client: clientId,
      technician: technicianUserId,
      technicianProfile: technicianProfileId || technician._id
    });
    await conversation.save();

    // ─── OPTIONAL GREETING ────────────────────────
    // Pre-populates the chat so the technician sees context immediately.
    if (initialMessage?.trim()) {
      const message = new Message({
        conversation: conversation._id,
        sender: clientId,
        receiver: technicianUserId,
        content: initialMessage.trim(),
        messageType: 'text'
      });
      await message.save();

      // Update conversation preview + bump technician unread count.
      conversation.lastMessage = {
        content: initialMessage.trim(),
        sender: clientId,
        sentAt: new Date(),
        messageType: 'text'
      };
      conversation.participants[1].unreadCount = 1; // Technician is index 1
      await conversation.save();
    }

    // Return fully populated document for immediate navigation.
    const populated = await Conversation.findById(conversation._id)
      .populate('participants.user', 'firstName lastName profileImage')
      .populate('technicianProfile', 'profileHeadline mainCategory');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// POST /api/chat/conversations/:id/messages
// ===========================================
/**
 * HTTP FALLBACK for sending messages.
 * 
 * Primary flow is Socket.io (instant), but this REST endpoint
 * exists for retries, offline queueing, or API integrations.
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const senderId = req.user.userId;
    const { content, messageType = 'text', media, replyTo } = req.body;

    if (!content?.trim() && !media) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }

    // Verify sender belongs to this active conversation.
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': senderId,
      status: 'active'
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Derive receiver (the participant who isn't the sender).
    const receiverId = conversation.participants.find(
      p => p.user.toString() !== senderId
    )?.user;

    // Persist message.
    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      receiver: receiverId,
      content: content?.trim() || '',
      messageType,
      media: media || undefined,
      replyTo: replyTo || undefined
    });
    await message.save();

    // ─── UPDATE CONVERSATION PREVIEW ──────────────
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

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName profileImage')
      .lean();

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// PUT /api/chat/conversations/:id/read
// ===========================================
/**
 * Explicitly mark every message in a conversation as read.
 * Called by Socket.io when user opens a chat, but also exposed
 * as REST for manual "Mark as read" buttons.
 */
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    await Message.updateMany(
      { conversation: conversationId, receiver: userId, readAt: null },
      { readAt: new Date() }
    );
    await Conversation.updateOne(
      { _id: conversationId, 'participants.user': userId },
      { $set: { 'participants.$.unreadCount': 0 } }
    );

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// GET /api/chat/unread-count
// ===========================================
/**
 * Total unread messages across ALL conversations.
 * Used for the red badge on the navbar Message icon.
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Conversation.aggregate([
      { $match: { 'participants.user': new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$participants' },
      { $match: { 'participants.user': new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalUnread: { $sum: '$participants.unreadCount' } } }
    ]);

    res.json({ success: true, count: result[0]?.totalUnread || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};