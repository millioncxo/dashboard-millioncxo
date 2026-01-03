'use client';

import { CheckCircle2, Circle } from 'lucide-react';

export interface MessageBubbleProps {
  text: string;
  senderRole: 'CLIENT' | 'SDR';
  timestamp: string;
  isRead: boolean;
  isOwnMessage: boolean;
}

export default function MessageBubble({
  text,
  senderRole,
  timestamp,
  isRead,
  isOwnMessage,
}: MessageBubbleProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '0.75rem 1rem',
          borderRadius: '1rem',
          background: isOwnMessage
            ? 'linear-gradient(135deg, var(--golden-opal) 0%, #d4c76b 100%)'
            : 'white',
          color: isOwnMessage ? 'var(--onyx-black)' : 'var(--imperial-emerald)',
          border: isOwnMessage
            ? 'none'
            : '2px solid rgba(196, 183, 91, 0.3)',
          boxShadow: isOwnMessage
            ? '0 2px 8px rgba(196, 183, 91, 0.3)'
            : '0 2px 4px rgba(0, 0, 0, 0.05)',
          wordWrap: 'break-word',
        }}
      >
        <div style={{ marginBottom: '0.25rem', lineHeight: '1.5' }}>
          {text}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: isOwnMessage
              ? 'rgba(11, 15, 14, 0.6)'
              : 'var(--muted-jade)',
            marginTop: '0.5rem',
          }}
        >
          <span>{formattedTime}</span>
          {isOwnMessage && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {isRead ? (
                <CheckCircle2 size={14} color="rgba(11, 15, 14, 0.6)" />
              ) : (
                <Circle size={14} color="rgba(11, 15, 14, 0.6)" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

