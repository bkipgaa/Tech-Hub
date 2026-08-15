import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Phone, MoreVertical, Image, 
  Paperclip, MessageCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatSidebar from './ChatSidebar';
import MessageBubble from './MessageBubble';
import { initSocket, getSocket } from '../../services/socket';

/**
 * ChatPage
 * ========
 * Main chat interface. Split into two columns:
 *  - Left:  ChatSidebar (conversation list)
 *  - Right: Active conversation (header + messages + input)
 * 
 * Architecture:
 *  - REST API calls go through AuthContext (getConversations, getMessages, etc.)
 *  - Real-time events go through Socket.io (send_message, typing, mark_read)
 *  - Both layers stay in sync: socket updates trigger sidebar refreshes.
 */
const ChatPage = () => {
  const { conversationId } = useParams();   // From URL /chat/:conversationId
  const navigate = useNavigate();

  // ─── AUTH CONTEXT ─────────────────────────────
  // Pull user, token, and chat-related API functions from AuthContext.
  // All HTTP calls are centralized there for consistency with the rest of the app.
  const { 
    user, 
    token, 
    getConversations, 
    getMessages, 
    markAsRead 
  } = useAuth();
  
  // ─── LOCAL STATE ──────────────────────────────
  const [conversations, setConversations] = useState([]);   // Sidebar inbox list
  const [messages, setMessages] = useState([]);             // Current chat bubbles
  const [inputText, setInputText] = useState('');           // Input box value
  const [loading, setLoading] = useState(true);             // Messages loading flag
  const [otherParty, setOtherParty] = useState(null);       // Header avatar / name
  const [isTyping, setIsTyping] = useState(false);          // Typing indicator
  const [hasMore, setHasMore] = useState(false);            // Pagination flag
  const [page, setPage] = useState(1);                      // Current message page
  
  // ─── REFS ─────────────────────────────────────
  const messagesEndRef = useRef(null);      // Anchor for auto-scroll to bottom
  const typingTimeoutRef = useRef(null);    // Debounce timer for typing events
  const inputRef = useRef(null);            // Keep keyboard focus after send

  // ===========================================
  // SOCKET.IO SETUP
  // ===========================================
  /**
   * Initialize the socket singleton once the user has a token.
   * We register event listeners for:
   *   - new_message      → append to current chat + refresh sidebar
   *   - typing           → show / hide the "Typing..." indicator
   *   - messages_read    → turn single-check into blue double-check
   * 
   * Cleanup removes listeners on unmount to prevent duplicates
   * when React StrictMode remounts the component.
   */
  useEffect(() => {
    if (!token) return;
    
    const socket = initSocket(token);
    socket.emit('authenticate', token);
    
    // ─── INCOMING REAL-TIME MESSAGE ─────────────
    socket.on('new_message', ({ message, conversationId: convId }) => {
      // Only append if we're currently viewing this exact conversation.
      if (convId === conversationId) {
        setMessages(prev => [...prev, message]);
        // Mark as read immediately since the chat is open.
        socket.emit('mark_read', { conversationId: convId });
      }
      // Always refresh the sidebar so the preview text updates.
      refreshConversations();
    });
    
    // ─── TYPING INDICATOR ───────────────────────
    socket.on('typing', ({ conversationId: convId, isTyping: typing }) => {
      if (convId === conversationId) setIsTyping(typing);
    });
    
    // ─── READ RECEIPTS ──────────────────────────
    // When the OTHER party reads our messages, update our bubbles
    // so the grey single-check becomes a blue double-check.
    socket.on('messages_read', ({ conversationId: convId }) => {
      if (convId === conversationId) {
        setMessages(prev => prev.map(m => 
          m.readAt ? m : { ...m, readAt: new Date() }
        ));
      }
    });

    // Cleanup: remove only these three listeners so we don't leak memory
    // or stack duplicate handlers on hot-reload / re-mount.
    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.off('messages_read');
    };
  }, [token, conversationId]);

  // ===========================================
  // LOAD CONVERSATION LIST (sidebar inbox)
  // ===========================================
  /**
   * Fetches the user's inbox via AuthContext.
   * Called on mount and after every incoming message so the
   * sidebar preview + unread badges stay fresh.
   */
  const refreshConversations = async () => {
    try {
      const res = await getConversations();
      if (res.success) setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===========================================
  // LOAD MESSAGES when conversationId changes
  // ===========================================
  /**
   * Whenever the user clicks a different conversation (or first loads
   * the page with a conversationId in the URL):
   *  1. Reset pagination to page 1.
   *  2. Fetch the newest 30 messages via AuthContext.
   *  3. Join the Socket.io room for this conversation.
   *  4. Mark messages as read (clears the red badge).
   *  5. Extract the other party's info for the header.
   * 
   * On cleanup (switching away), leave the old Socket room so we
   * don't receive messages for chats we're no longer viewing.
   */
  useEffect(() => {
    // No chat selected → render the empty state.
    if (!conversationId) {
      setMessages([]);
      setOtherParty(null);
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        setPage(1);
        
        // Fetch page 1 through AuthContext (centralized error handling).
        const res = await getMessages(conversationId, 1, 30);
        
        if (res.success) {
          setMessages(res.data);
          setHasMore(res.pagination?.hasMore || false);
          
          // ─── SOCKET ROOM MANAGEMENT ─────────────
          const socket = getSocket();
          socket?.emit('join_conversation', conversationId);
          socket?.emit('mark_read', { conversationId });
          
          // Pull the other party's profile from the already-loaded
          // conversations list so the header renders instantly.
          const conv = conversations.find(c => c._id === conversationId);
          if (conv) setOtherParty(conv.otherParty);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    
    // Cleanup: leave the previous conversation room.
    return () => {
      const socket = getSocket();
      socket?.emit('leave_conversation', conversationId);
    };
  }, [conversationId, conversations, getMessages]);

  // ===========================================
  // AUTO-SCROLL to newest message
  // ===========================================
  /**
   * Every time messages change or the typing indicator appears,
   * scroll the view to the invisible anchor at the bottom.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ===========================================
  // SEND MESSAGE (Socket.io)
  // ===========================================
  /**
   * Emits 'send_message' over the persistent socket.
   * The server persists it to MongoDB, then broadcasts it back
   * to everyone in the conversation room (including us).
   * 
   * We clear the input immediately for a snappy UX (optimistic UI).
   */
  const handleSend = () => {
    if (!inputText.trim() || !conversationId) return;
    
    const socket = getSocket();
    socket?.emit('send_message', {
      conversationId,
      content: inputText.trim(),
      messageType: 'text'
    });
    
    setInputText('');
    inputRef.current?.focus();
  };

  // ===========================================
  // TYPING INDICATOR DEBOUNCE
  // ===========================================
  /**
   * Emits typing:true on every keystroke, then starts a 2-second
   * timer. If the user stops typing, the timer fires typing:false.
   * This prevents the indicator from flickering on every character.
   */
  const handleTyping = () => {
    const socket = getSocket();
    socket?.emit('typing', { conversationId, isTyping: true });
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing', { conversationId, isTyping: false });
    }, 2000);
  };

  // Send on Enter (but allow Shift+Enter for newlines).
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ===========================================
  // LOAD MORE MESSAGES (infinite scroll up)
  // ===========================================
  /**
   * Fetches the next page of older messages and prepends them
   * to the top of the messages array.
   */
  const loadMore = async () => {
    if (!hasMore || !conversationId) return;
    const nextPage = page + 1;
    
    try {
      const res = await getMessages(conversationId, nextPage, 30);
      if (res.success) {
        setMessages(prev => [...res.data, ...prev]);
        setHasMore(res.pagination?.hasMore || false);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  };

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100">
      
      {/* ─── LEFT: SIDEBAR ──────────────────────── */}
      <ChatSidebar 
        conversations={conversations}
        activeConversationId={conversationId}
        onSelect={(id) => navigate(`/chat/${id}`)}
        currentUserId={user?.userId}
      />

      {/* ─── RIGHT: CHAT AREA ───────────────────── */}
      <div className="flex-1 flex flex-col">
        {conversationId ? (
          <>
            {/* ─── HEADER ─────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile back button (visible only on small screens) */}
                <button 
                  onClick={() => navigate(-1)}
                  className="lg:hidden text-gray-500 hover:text-green-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                {otherParty && (
                  <>
                    <div className="relative">
                      {otherParty.profileImage ? (
                        <img 
                          src={otherParty.profileImage} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                          {otherParty.firstName?.[0]}{otherParty.lastName?.[0]}
                        </div>
                      )}
                      {/* Online indicator dot */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {otherParty.firstName} {otherParty.lastName}
                      </h3>
                      <p className="text-xs text-green-600">
                        {isTyping ? 'Typing...' : 'Online'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ─── MESSAGES SCROLL AREA ───────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
              {/* Load older messages button */}
              {hasMore && (
                <button 
                  onClick={loadMore}
                  className="w-full text-center text-sm text-green-600 hover:underline py-2"
                >
                  Load more messages
                </button>
              )}
              
              {/* Render each message bubble */}
              {messages.map((msg, idx) => (
                <MessageBubble 
                  key={msg._id || idx}
                  message={msg}
                  isOwn={
                    msg.sender?._id === user?.userId || 
                    msg.sender === user?.userId
                  }
                  showAvatar={
                    idx === 0 || 
                    messages[idx - 1]?.sender?._id !== msg.sender?._id
                  }
                />
              ))}
              
              {/* Typing animation (3 bouncing dots) */}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>typing...</span>
                </div>
              )}
              
              {/* Invisible anchor for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* ─── INPUT AREA ─────────────────────── */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-end gap-3">
                <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                  <Image className="w-5 h-5" />
                </button>
                
                {/* Auto-expanding textarea */}
                <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onInput={handleTyping}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent resize-none outline-none text-gray-700 max-h-32"
                    style={{ minHeight: '24px' }}
                  />
                </div>
                
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ─── EMPTY STATE (no chat selected) ─── */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Messages</h3>
              <p className="text-gray-500 max-w-sm">
                Select a conversation from the sidebar or start messaging a technician from their profile.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;