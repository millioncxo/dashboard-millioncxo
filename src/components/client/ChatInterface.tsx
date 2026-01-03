'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import MessageList, { Message } from '@/components/shared/MessageList';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          setMessages([]);
          return;
        }
        if (response.status === 404 && data.error?.includes('No SDR assigned')) {
          setError('No SDR has been assigned to your account yet. Please contact support.');
          setLoading(false);
          setMessages([]);
          return;
        }
        throw new Error(data.error || 'Failed to fetch messages');
      }
      
      if (data.success) {
        setMessages(data.messages || []);
        setError(null);
        // Show warning if no SDR assigned
        if (data.warning) {
          setError(data.warning);
        }
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load messages');
        setMessages([]); // Set empty array on error so loading stops
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);
    setError(null);

    // Optimistic update
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      text: textToSend,
      senderRole: 'CLIENT',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      if (data.success && data.message) {
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === optimisticMessage._id ? data.message : msg
          )
        );
        // Fetch latest messages to ensure sync
        await fetchMessages();
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticMessage._id)
      );
      // Restore message text
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true;
    let timeoutId: NodeJS.Timeout;
    
    // Initial fetch with timeout
    timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setLoading(false);
        setError('Request timed out. Please refresh the page.');
        setMessages([]);
      }
    }, 10000); // 10 second timeout

    // Initial fetch
    fetchMessages().finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    fetchUnreadCount();

    // Poll every 4 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchMessages();
        fetchUnreadCount();
      }
    }, 4000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        background: 'white',
        borderRadius: '1rem',
        border: '2px solid rgba(196, 183, 91, 0.3)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'linear-gradient(135deg, rgba(196, 183, 91, 0.1) 0%, rgba(196, 183, 91, 0.05) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--imperial-emerald)',
              margin: 0,
            }}
          >
            Chat with Your SDR
          </h3>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                fontWeight: '600',
                marginTop: '0.25rem',
                display: 'block',
              }}
            >
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(220, 38, 38, 0.1)',
            borderBottom: '1px solid rgba(220, 38, 38, 0.2)',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '1.25rem',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MessageList
          messages={messages}
          currentUserRole="CLIENT"
          loading={loading}
          emptyMessage="No messages yet. Start the conversation with your SDR!"
        />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderTop: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'var(--ivory-silk)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
            rows={3}
            maxLength={5000}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '2px solid rgba(196, 183, 91, 0.3)',
              borderRadius: '0.5rem',
              background: 'white',
              color: 'var(--onyx-black)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--golden-opal)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(196, 183, 91, 0.3)';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || sending}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: !messageText.trim() || sending ? 0.5 : 1,
              cursor: !messageText.trim() || sending ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={18} />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted-jade)',
            marginTop: '0.5rem',
            textAlign: 'right',
          }}
        >
          {messageText.length} / 5000 characters
        </div>
      </div>
    </div>
  );
}

