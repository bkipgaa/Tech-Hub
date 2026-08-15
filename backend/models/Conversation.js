const mongoose = require('mongoose');

/**
 * Conversation Model
 * ==================
 * Represents a chat thread between exactly two users:
 * a CLIENT and a TECHNICIAN.
 * 
 * Each user pair gets ONE conversation (enforced by unique index).
 * We store participant metadata directly for fast inbox queries
 * without needing to populate nested arrays every time.
 */
const conversationSchema = new mongoose.Schema({
  
  // ─── PARTICIPANTS ─────────────────────────────
  // Array of both parties with role + unread tracking per person.
  // This lets us show "2 unread" for the receiver while sender sees 0.
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['client', 'technician'], required: true },
    unreadCount: { type: Number, default: 0 },      // How many messages THIS user hasn't seen
    lastReadAt: { type: Date, default: null }        // Last time they opened this chat
  }],
  
  // ─── DIRECT REFERENCES ────────────────────────
  // Flattened foreign keys for fast querying (avoids digging into participants array).
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Link to technician profile so inbox can show "Electrician" under the name.
  technicianProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  
  // Optional: tie chat to a specific booking/job request.
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  
  // ─── LAST MESSAGE (INBOX PREVIEW) ─────────────
  // Denormalized snapshot of the most recent message.
  // We duplicate it here so the inbox list loads in ONE query
  // instead of joining the Messages collection.
  lastMessage: {
    content: { type: String, default: '' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: null },
    messageType: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' }
  },
  
  // ─── STATUS ───────────────────────────────────
  status: { 
    type: String, 
    enum: ['active', 'archived', 'blocked'], 
    default: 'active' 
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true  // Auto-manages createdAt & updatedAt
});

// ─── INDEXES ────────────────────────────────────
// These make inbox queries (sorted by updatedAt) instant even with 100k+ conversations.
conversationSchema.index({ client: 1, updatedAt: -1 });          // Client inbox lookup
conversationSchema.index({ technician: 1, updatedAt: -1 });      // Technician inbox lookup
conversationSchema.index({ 'participants.user': 1 });            // Generic participant search
conversationSchema.index({ client: 1, technician: 1 }, { unique: true }); // Prevent duplicate threads

module.exports = mongoose.model('Conversation', conversationSchema);