import React from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * ChatSidebar
 * ===========
 * Left column showing all conversations.
 * 
 * Each row displays:
 *  - Avatar with unread badge (red circle with count)
 *  - Other party's name
 *  - Last message preview ("You: ..." or just text)
 *  - Timestamp (relative: "2m", "3h", "Yesterday")
 *  - Active state highlight (green left border + background tint)
 */
const ChatSidebar = ({ conversations, activeConversationId, onSelect, currentUserId }) => {

  // Convert ISO date to human-readable relative time.
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';           // < 1 min
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;   // mins
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; // hours
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`; // days
    return d.toLocaleDateString();
  };

  // Truncate long preview text with ellipsis.
  const truncate = (text, len = 35) => {
    if (!text) return '';
    return text.length > len ? text.substring(0, len) + '...' : text;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
      {/* Sidebar header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          Messages
        </h2>
      </div>

      {/* Scrollable conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeConversationId;
            const other = conv.otherParty;   // The person we're chatting with
            
            return (
              <button
                key={conv._id}
                onClick={() => onSelect(conv._id)}
                className={`w-full px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                  isActive 
                    ? 'bg-green-50 border-l-4 border-l-green-600'   // Active styling
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                {/* Avatar with unread badge */}
                <div className="relative flex-shrink-0">
                  {other?.profileImage ? (
                    <img src={other.profileImage} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                      {other?.firstName?.[0]}{other?.lastName?.[0]}
                    </div>
                  )}
                  {/* Red badge shows unread count (hidden if 0) */}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                
                {/* Text preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className={`font-semibold text-sm truncate ${
                      conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {other?.firstName} {other?.lastName}
                    </h4>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessage?.sentAt || conv.updatedAt)}
                    </span>
                  </div>
                  
                  {/* Last message preview */}
                  <p className={`text-sm truncate ${
                    conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'
                  }`}>
                    {conv.lastMessage?.sender === currentUserId ? 'You: ' : ''}
                    {truncate(conv.lastMessage?.content)}
                  </p>
                  
                  {/* Trade category tag (e.g. "Electrician") */}
                  {conv.technicianProfile && (
                    <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {conv.technicianProfile.mainCategory || 'Technician'}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;