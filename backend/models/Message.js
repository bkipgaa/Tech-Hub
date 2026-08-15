const mongoose = require('mongoose');

/**
 * Message Model
 * =============
 * Every individual text, image, file, or system notification
 * sent inside a Conversation.
 * 
 * We keep messages in a separate collection (not embedded in Conversation)
 * so a chat with 10,000 messages doesn't bloat the parent document.
 */
const messageSchema = new mongoose.Schema({
  
  // ─── RELATIONSHIPS ────────────────────────────
  conversation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true   // Critical: all message queries filter by conversation first
  },
  
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // ─── CONTENT ──────────────────────────────────
  content: { 
    type: String, 
    required: function() { 
      // Media messages don't need text content
      return this.messageType === 'text'; 
    }
  },
  
  // ─── MESSAGE TYPE ─────────────────────────────
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file', 'system', 'offer'], 
    default: 'text' 
  },
  
  // ─── MEDIA ATTACHMENTS ────────────────────────
  // Populated when messageType is 'image' or 'file'.
  media: {
    url: { type: String, default: null },        // S3 / CDN URL
    filename: { type: String, default: null },   // Original filename
    size: { type: Number, default: null },       // File size in bytes
    mimeType: { type: String, default: null }    // e.g. "image/png"
  },
  
  // ─── SERVICE OFFER (future feature) ───────────
  // Allows technicians to send structured price quotes inside chat.
  offer: {
    serviceName: String,
    description: String,
    estimatedPrice: Number,
    currency: { type: String, default: 'KES' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
  },
  
  // ─── READ RECEIPTS ────────────────────────────
  // deliveredAt = when server received it (always set).
  // readAt = when receiver actually opened the chat (null until then).
  readAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: Date.now },
  
  // ─── SOFT DELETE ──────────────────────────────
  // "Unsend" feature — message hidden but preserved in DB for audit.
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  
  // ─── REPLY THREADING ──────────────────────────
  // References another message to show "Replying to..." UI.
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }
  
}, {
  timestamps: true  // createdAt = sent time, updatedAt = edit time (future)
});

// ─── INDEX ──────────────────────────────────────
// Fetching messages for a conversation sorted newest-first.
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);