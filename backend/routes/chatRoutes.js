const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

/**
 * ALL CHAT ROUTES ARE PROTECTED
 * ==============================
 * Every endpoint below requires a valid JWT token.
 * The authenticate middleware sets req.user.userId.
 */
router.use(auth);

// ─── INBOX ──────────────────────────────────────
// GET  /api/chat/conversations          → List all my chats (sidebar)
// POST /api/chat/conversations          → Start new chat with technician
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);

// ─── MESSAGES ───────────────────────────────────
// GET  /api/chat/conversations/:id/messages  → Paginated history
// POST /api/chat/conversations/:id/messages  → HTTP fallback send
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);

// ─── READ RECEIPTS ──────────────────────────────
// PUT /api/chat/conversations/:id/read       → Mark all as read
router.put('/conversations/:conversationId/read', chatController.markAsRead);

// ─── BADGE COUNT ────────────────────────────────
// GET /api/chat/unread-count                 → Total unread (navbar)
router.get('/unread-count', chatController.getUnreadCount);

module.exports = router;