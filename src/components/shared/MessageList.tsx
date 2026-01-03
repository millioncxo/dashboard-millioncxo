'use client';

import { useEffect, useRef } from 'react';
import MessageBubble, { MessageBubbleProps } from './MessageBubble';

export interface Message {
  _id: string;
  text: string;
  senderRole: 'CLIENT' | 'SDR';
  createdAt: string;
  read: boolean;
}

export interface MessageListProps {
  messages: Message[];
  currentUserRole: 'CLIENT' | 'SDR';
  loading?: boolean;
  emptyMessage?: string;
}

export default function MessageList({
  messages,
  currentUserRole,
  loading = false,
  emptyMessage = 'No messages yet. Start the conversation!',
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          minHeight: '200px',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          minHeight: '200px',
          color: 'var(--muted-jade)',
          textAlign: 'center',
        }}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {messages.map((message) => {
        const isOwnMessage = message.senderRole === currentUserRole;
        return (
          <MessageBubble
            key={message._id}
            text={message.text}
            senderRole={message.senderRole}
            timestamp={message.createdAt}
            isRead={message.read}
            isOwnMessage={isOwnMessage}
          />
        );
      })}
      {loading && messages.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '0.5rem',
          }}
        >
          <div className="spinner" style={{ width: '20px', height: '20px' }} />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

