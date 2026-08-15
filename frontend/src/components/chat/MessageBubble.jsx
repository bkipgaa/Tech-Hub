import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

/**
 * MessageBubble
 * =============
 * Renders a single chat message inside the conversation thread.
 *
 * Responsibilities:
 *  - Aligns messages to the RIGHT for the current user, LEFT for the other party.
 *  - Shows an avatar only on the FIRST message in a consecutive run from the same sender.
 *    This prevents visual clutter when someone sends multiple messages back-to-back.
 *  - Displays a timestamp below every message.
 *  - Renders read-receipt icons on outgoing messages:
 *      Single grey check  = delivered to server
 *      Double grey check  = delivered to recipient's device
 *      Double BLUE check  = recipient has opened the chat (readAt is set)
 *  - Handles system messages (e.g. "Booking confirmed") as centered banners.
 *
 * Props:
 *  @param {Object} message      - The message document from MongoDB
 *  @param {boolean} isOwn       - True if the current logged-in user sent this message
 *  @param {boolean} showAvatar  - True if this is the first message in a consecutive sender block
 */
const MessageBubble = ({ message, isOwn, showAvatar }) => {

  /**
   * formatTime
   * ----------
   * Converts an ISO date string into a compact local time
   * (e.g. "14:32") suitable for chat meta text.
   */
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ─── SYSTEM MESSAGES ──────────────────────────
  /**
   * System messages (messageType === 'system') are not chat bubbles.
   * They appear as small centered pills (e.g. "Technician accepted your offer").
   */
  const isSystem = message.messageType === 'system';
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // ─── REGULAR CHAT BUBBLE ──────────────────────
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`flex max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
        
        {/* ─── AVATAR ───────────────────────────── */}
        {/* 
          We only render the avatar on the FIRST message of a consecutive 
          block from the same sender. For every subsequent message in that 
          block, showAvatar is false and we render an empty spacer div 
          so the bubble stays aligned vertically. 
        */}
        {!isOwn && showAvatar && (
          <div className="flex-shrink-0 self-end">
            {message.sender?.profileImage ? (
              <img 
                src={message.sender.profileImage} 
                alt="" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-semibold">
                {/* Safe fallback: show initials or '?' if name fields are missing */}
                {message.sender?.firstName?.[0] || '?'}
                {message.sender?.lastName?.[0] || ''}
              </div>
            )}
          </div>
        )}
        
        {/* Empty spacer to preserve alignment when avatar is hidden */}
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        {/* ─── BUBBLE ───────────────────────────── */}
        <div className={`relative px-4 py-2.5 rounded-2xl ${
          isOwn 
            ? 'bg-green-600 text-white rounded-br-md'         // My messages: green bubble
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm' // Theirs: white card
        }`}>
          
          {/* Message text content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {/* ─── META ROW (time + read status) ──── */}
          <div className={`flex items-center gap-1 mt-1 ${
            isOwn ? 'justify-end text-green-100' : 'justify-end text-gray-400'
          }`}>
            {/* Timestamp */}
            <span className="text-[10px]">
              {formatTime(message.createdAt)}
            </span>
            
            {/* Read receipts — ONLY rendered on outgoing (own) messages */}
            {isOwn && (
              <span className="ml-0.5">
                {message.readAt ? (
                  /* 
                    Double BLUE checkmark = recipient has opened the chat 
                    and the 'mark_read' event fired (readAt timestamp exists). 
                  */
                  <CheckCheck className="w-3 h-3 text-blue-300" />
                ) : message.deliveredAt ? (
                  /* 
                    Double GREY checkmark = message was delivered to the 
                    recipient's device but not yet read. 
                  */
                  <CheckCheck className="w-3 h-3 text-current opacity-60" />
                ) : (
                  /* 
                    Single checkmark = message was sent to the server 
                    but delivery status is unknown. 
                  */
                  <Check className="w-3 h-3 text-current opacity-60" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;