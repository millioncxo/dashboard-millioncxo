'use client';

import { useEffect, useState } from 'react';
import ChatInterface from '@/components/client/ChatInterface';
import { MessageSquare, Calendar, History, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/client/chat-history');
      if (response.ok) {
        const result = await response.json();
        setChatHistory(result.chatHistory || []);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/client')}
              className="btn-secondary"
              style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--imperial-emerald)' }}>
              Messages
            </h1>
          </div>
        </div>

        {/* Live Chat Section */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(196, 183, 91, 0.2)', paddingBottom: '0.75rem' }}>
            <MessageSquare size={20} color="var(--imperial-emerald)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>Live SDR Chat</h2>
          </div>
          <ChatInterface />
        </div>

        {/* Historical Archive Section */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(196, 183, 91, 0.2)', paddingBottom: '0.75rem' }}>
            <History size={20} color="var(--imperial-emerald)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>LinkedIn Conversation Archive</h2>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" />
              <p style={{ marginTop: '1rem', color: 'var(--muted-jade)' }}>Loading archive...</p>
            </div>
          ) : chatHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(196, 183, 91, 0.05)', borderRadius: '0.75rem' }}>
              <p style={{ color: 'var(--muted-jade)' }}>
                No historical LinkedIn logs available for this account.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {chatHistory.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    borderLeft: `4px solid ${entry.type === 'initial' ? '#3b82f6' : 'var(--golden-opal)'}`,
                    padding: '1.25rem',
                    background: entry.type === 'initial' ? 'rgba(59, 130, 246, 0.03)' : 'rgba(196, 183, 91, 0.03)',
                    borderRadius: '0 0.75rem 0.75rem 0',
                    border: '1px solid rgba(196, 183, 91, 0.1)',
                    borderLeftWidth: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          background: entry.type === 'initial' ? '#3b82f6' : 'var(--golden-opal)',
                          color: 'white',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {entry.type === 'initial' ? 'Initial Import' : 'Update'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
                        <Calendar size={14} />
                        {new Date(entry.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: 'var(--imperial-emerald)',
                      lineHeight: '1.6',
                      fontSize: '0.9375rem',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(196, 183, 91, 0.15)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    {entry.chatHistory}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
