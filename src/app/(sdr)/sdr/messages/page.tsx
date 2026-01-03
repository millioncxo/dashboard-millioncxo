'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { MessageSquare, ArrowRight, Circle } from 'lucide-react';

interface ClientMessage {
  clientId: string;
  clientName: string;
  pointOfContact: {
    name: string;
    email: string;
  };
  lastMessage?: {
    text: string;
    senderRole: 'CLIENT' | 'SDR';
    createdAt: string;
    read: boolean;
  };
  unreadCount: number;
  totalMessages: number;
}

export default function SdrMessagesPage() {
  const router = useRouter();
  const [clientMessages, setClientMessages] = useState<ClientMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch clients with their message summaries
  const fetchClientMessages = useCallback(async () => {
    try {
      // Fetch all assigned clients
      const clientsResponse = await fetch('/api/sdr/clients');
      if (!clientsResponse.ok) {
        throw new Error('Failed to fetch clients');
      }
      const clientsData = await clientsResponse.json();
      const clients = clientsData.clients || [];

      // Fetch unread counts
      const unreadResponse = await fetch('/api/messages/unread');
      const unreadData = unreadResponse.ok ? await unreadResponse.json() : { unreadCounts: [] };
      const unreadCounts = unreadData.unreadCounts || [];

      // Fetch last message for each client
      const clientMessagesPromises = clients.map(async (client: any) => {
        try {
          const messagesResponse = await fetch(`/api/messages?clientId=${client.clientId}&limit=1`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const lastMessage = messagesData.messages && messagesData.messages.length > 0
              ? messagesData.messages[messagesData.messages.length - 1]
              : null;

            const unreadInfo = unreadCounts.find((uc: any) => uc.clientId === client.clientId);
            
            return {
              clientId: client.clientId,
              clientName: client.businessName,
              pointOfContact: client.pointOfContact,
              lastMessage: lastMessage ? {
                text: lastMessage.text,
                senderRole: lastMessage.senderRole,
                createdAt: lastMessage.createdAt,
                read: lastMessage.read,
              } : undefined,
              unreadCount: unreadInfo?.unreadCount || 0,
              totalMessages: messagesData.pagination?.total || 0,
            };
          }
        } catch (err) {
          console.error(`Error fetching messages for client ${client.clientId}:`, err);
        }
        
        const unreadInfo = unreadCounts.find((uc: any) => uc.clientId === client.clientId);
        return {
          clientId: client.clientId,
          clientName: client.businessName,
          pointOfContact: client.pointOfContact,
          lastMessage: undefined,
          unreadCount: unreadInfo?.unreadCount || 0,
          totalMessages: 0,
        };
      });

      const messages = await Promise.all(clientMessagesPromises);
      setClientMessages(messages);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching client messages:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load messages');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true;
    fetchClientMessages();

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchClientMessages();
      }
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      isMountedRef.current = false;
    };
  }, [fetchClientMessages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleRowClick = (clientId: string) => {
    router.push(`/sdr/messages/${clientId}`);
  };

  // Sort by unread count first, then by last message time
  const sortedMessages = [...clientMessages].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return a.clientName.localeCompare(b.clientName);
  });

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <LogoComponent width={48} height={26} hoverGradient={true} />
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '0.25rem', 
            color: 'var(--imperial-emerald)' 
          }}>
            Messages
          </h1>
          <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
            View and manage messages from your clients
          </p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee2e2', color: '#dc2626', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Messages Table */}
      <div className="card" style={{ 
        padding: '0',
        boxShadow: '0 8px 24px rgba(11, 46, 43, 0.1)',
        border: '1px solid rgba(196, 183, 91, 0.3)'
      }}>
        <div style={{ 
          padding: '1.75rem', 
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'linear-gradient(135deg, rgba(196, 183, 91, 0.12) 0%, rgba(196, 183, 91, 0.06) 100%)',
          borderRadius: '0.75rem 0.75rem 0 0'
        }}>
          <h2 style={{ 
            fontSize: '1.75rem', 
            marginBottom: '0.5rem', 
            color: 'var(--imperial-emerald)', 
            fontWeight: '700',
            letterSpacing: '-0.01em'
          }}>
            Client Messages
          </h2>
          <p style={{ 
            color: 'var(--muted-jade)', 
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {sortedMessages.length} {sortedMessages.length === 1 ? 'client' : 'clients'}
            {sortedMessages.reduce((sum, cm) => sum + cm.unreadCount, 0) > 0 && (
              <span style={{ 
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                background: '#dc2626',
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {sortedMessages.reduce((sum, cm) => sum + cm.unreadCount, 0)} unread
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" />
            <p style={{ marginTop: '1rem', color: 'var(--muted-jade)' }}>Loading messages...</p>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--muted-jade)' }} />
            <p style={{ color: 'var(--muted-jade)', fontSize: '1rem' }}>
              No clients assigned yet. Messages will appear here once clients start messaging.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'rgba(11, 46, 43, 0.05)',
                  borderBottom: '2px solid rgba(196, 183, 91, 0.3)'
                }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '250px'
                  }}>
                    Client
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Last Message
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: '600', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '120px'
                  }}>
                    Unread
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: '600', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '150px'
                  }}>
                    Last Activity
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: '600', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '120px'
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMessages.map((clientMsg) => {
                  const hasUnread = clientMsg.unreadCount > 0;
                  return (
                    <tr
                      key={clientMsg.clientId}
                      style={{
                        borderBottom: '1px solid rgba(196, 183, 91, 0.15)',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        background: hasUnread ? 'rgba(220, 38, 38, 0.05)' : 'transparent',
                      }}
                      onClick={() => handleRowClick(clientMsg.clientId)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = hasUnread 
                          ? 'rgba(220, 38, 38, 0.1)' 
                          : 'rgba(196, 183, 91, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = hasUnread 
                          ? 'rgba(220, 38, 38, 0.05)' 
                          : 'transparent';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ 
                            fontWeight: hasUnread ? '700' : '600', 
                            color: 'var(--imperial-emerald)',
                            marginBottom: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {clientMsg.clientName}
                            {hasUnread && (
                              <Circle size={8} color="#dc2626" fill="#dc2626" />
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--muted-jade)' 
                          }}>
                            {clientMsg.pointOfContact.name}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--muted-jade)' 
                          }}>
                            {clientMsg.pointOfContact.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {clientMsg.lastMessage ? (
                          <div>
                            <div style={{ 
                              color: 'var(--muted-jade)', 
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem',
                              fontWeight: hasUnread && clientMsg.lastMessage.senderRole === 'CLIENT' ? '600' : '400'
                            }}>
                              {clientMsg.lastMessage.senderRole === 'CLIENT' ? (
                                <span style={{ color: '#3b82f6', fontWeight: '600' }}>Client: </span>
                              ) : (
                                <span style={{ color: 'var(--golden-opal)', fontWeight: '600' }}>You: </span>
                              )}
                              {truncateText(clientMsg.lastMessage.text)}
                            </div>
                            {clientMsg.totalMessages > 1 && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--muted-jade)' 
                              }}>
                                {clientMsg.totalMessages} total messages
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ 
                            color: 'var(--muted-jade)', 
                            fontSize: '0.875rem',
                            fontStyle: 'italic'
                          }}>
                            No messages yet
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {clientMsg.unreadCount > 0 ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.5rem',
                            background: '#dc2626',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            minWidth: '2rem'
                          }}>
                            {clientMsg.unreadCount}
                          </span>
                        ) : (
                          <span style={{ 
                            color: 'var(--muted-jade)', 
                            fontSize: '0.875rem' 
                          }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {clientMsg.lastMessage ? (
                          <div style={{ 
                            color: 'var(--muted-jade)', 
                            fontSize: '0.875rem' 
                          }}>
                            {formatTime(clientMsg.lastMessage.createdAt)}
                          </div>
                        ) : (
                          <span style={{ 
                            color: 'var(--muted-jade)', 
                            fontSize: '0.875rem' 
                          }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(clientMsg.clientId);
                          }}
                          className="btn-primary"
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: '0 auto'
                          }}
                        >
                          Open Chat
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

