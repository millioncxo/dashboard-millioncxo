'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, AlertCircle, MessageSquare } from 'lucide-react';
import MessageList, { Message } from '@/components/shared/MessageList';

interface Client {
  clientId: string;
  businessName: string;
  pointOfContact: {
    name: string;
    email: string;
  };
}

interface UnreadCount {
  clientId: string;
  clientName: string;
  unreadCount: number;
}

interface ChatInterfaceProps {
  initialClientId?: string | null;
  hideClientSelector?: boolean;
}

export default function ChatInterface({ initialClientId = null, hideClientSelector = false }: ChatInterfaceProps = {}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/sdr/clients');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Authentication required. Please log in again.');
          return;
        }
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      if (data.success && data.clients) {
        const formattedClients: Client[] = data.clients.map((client: any) => ({
          clientId: client.clientId,
          businessName: client.businessName,
          pointOfContact: client.pointOfContact,
        }));
        setClients(formattedClients);
        // Auto-select first client if none selected and no initialClientId provided
        if (!selectedClientId && !initialClientId && formattedClients.length > 0) {
          setSelectedClientId(formattedClients[0].clientId);
        } else if (initialClientId && !selectedClientId) {
          // If initialClientId is provided, use it
          setSelectedClientId(initialClientId);
        }
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load clients');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingClients(false);
      }
    }
  }, [selectedClientId, initialClientId]);

  // Fetch messages for selected client
  const fetchMessages = useCallback(async (clientId: string) => {
    try {
      const response = await fetch(`/api/messages?clientId=${clientId}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Authentication required. Please log in again.');
          return;
        }
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load messages');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCounts(data.unreadCounts || []);
        }
      }
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  }, []);

  // Get unread count for a specific client
  const getUnreadCount = (clientId: string): number => {
    const unread = unreadCounts.find((uc) => uc.clientId === clientId);
    return unread?.unreadCount || 0;
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || sending || !selectedClientId) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);
    setError(null);

    // Optimistic update
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      text: textToSend,
      senderRole: 'SDR',
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
        body: JSON.stringify({
          text: textToSend,
          clientId: selectedClientId,
        }),
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
        if (selectedClientId) {
          await fetchMessages(selectedClientId);
        }
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

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setMessages([]);
    setLoading(true);
    fetchMessages(clientId);
  };

  // Setup polling
  useEffect(() => {
    // Initial fetch
    fetchClients();
    fetchUnreadCounts();

    // Poll every 4 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchUnreadCounts();
        if (selectedClientId) {
          fetchMessages(selectedClientId);
        }
      }
    }, 4000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      isMountedRef.current = false;
    };
  }, [fetchClients, fetchUnreadCounts, selectedClientId, fetchMessages]);

  // Fetch messages when client selection changes or initialClientId is set
  useEffect(() => {
    if (initialClientId && !selectedClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId, selectedClientId]);

  useEffect(() => {
    if (selectedClientId) {
      setLoading(true);
      fetchMessages(selectedClientId);
    }
  }, [selectedClientId, fetchMessages]);

  const selectedClient = clients.find((c) => c.clientId === selectedClientId);

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
        }}
      >
        <div style={{ marginBottom: '0.75rem' }}>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--imperial-emerald)',
              margin: 0,
              marginBottom: '0.5rem',
            }}
          >
            {hideClientSelector && selectedClient ? `Chat with ${selectedClient.businessName}` : 'Client Messages'}
          </h3>
          {!hideClientSelector && (
            <select
              value={selectedClientId || ''}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={loadingClients || clients.length === 0}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '2px solid rgba(196, 183, 91, 0.3)',
                borderRadius: '0.5rem',
                background: 'white',
                color: 'var(--imperial-emerald)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {loadingClients ? (
                <option>Loading clients...</option>
              ) : clients.length === 0 ? (
                <option>No clients assigned</option>
              ) : (
                <>
                  <option value="">Select a client...</option>
                  {clients.map((client) => {
                    const unread = getUnreadCount(client.clientId);
                    return (
                      <option key={client.clientId} value={client.clientId}>
                        {client.businessName}
                        {unread > 0 && ` (${unread} unread)`}
                      </option>
                    );
                  })}
                </>
              )}
            </select>
          )}
        </div>
        {selectedClient && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)' }}>
            Contact: {selectedClient.pointOfContact.name} ({selectedClient.pointOfContact.email})
          </div>
        )}
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
      {selectedClientId ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MessageList
            messages={messages}
            currentUserRole="SDR"
            loading={loading}
            emptyMessage="No messages yet. Start the conversation!"
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'var(--muted-jade)',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div>
            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Select a client to start messaging</p>
          </div>
        </div>
      )}

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
            placeholder={selectedClientId ? 'Type your message...' : 'Select a client to send a message'}
            disabled={sending || !selectedClientId}
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
              opacity: !selectedClientId ? 0.5 : 1,
            }}
            onFocus={(e) => {
              if (selectedClientId) {
                e.target.style.borderColor = 'var(--golden-opal)';
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(196, 183, 91, 0.3)';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || sending || !selectedClientId}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: !messageText.trim() || sending || !selectedClientId ? 0.5 : 1,
              cursor: !messageText.trim() || sending || !selectedClientId ? 'not-allowed' : 'pointer',
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

