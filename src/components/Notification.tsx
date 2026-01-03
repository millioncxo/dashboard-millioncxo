'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type NotificationType = 'error' | 'success' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationProps) {
  useEffect(() => {
    // Auto-dismiss after 5 seconds for errors, 3 seconds for success
    const timeout = setTimeout(() => {
      onDismiss(notification.id);
    }, notification.type === 'error' ? 5000 : 3000);

    return () => clearTimeout(timeout);
  }, [notification.id, notification.type, onDismiss]);

  const icons = {
    error: <AlertCircle size={20} />,
    success: <CheckCircle size={20} />,
    info: <Info size={20} />,
  };

  const colors = {
    error: {
      bg: '#fee2e2',
      border: '#dc2626',
      text: '#dc2626',
      icon: '#dc2626',
    },
    success: {
      bg: '#d1fae5',
      border: '#10b981',
      text: '#059669',
      icon: '#10b981',
    },
    info: {
      bg: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
      icon: '#3b82f6',
    },
  };

  const color = colors[notification.type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: '0.5rem',
        color: color.text,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        marginBottom: '0.75rem',
        animation: 'slideIn 0.3s ease-out',
        maxWidth: '500px',
      }}
    >
      <div style={{ color: color.icon, flexShrink: 0 }}>
        {icons[notification.type]}
      </div>
      <div style={{ flex: 1, fontSize: '0.875rem', lineHeight: '1.5' }}>
        {notification.message}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: color.text,
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <X size={18} />
      </button>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: NotificationType = 'error') => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAll,
  };
}
