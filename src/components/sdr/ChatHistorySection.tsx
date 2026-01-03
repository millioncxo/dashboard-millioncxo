import React from 'react';
import { MessageSquare, Edit2, Save, X, History } from 'lucide-react';

interface ChatHistorySectionProps {
  chatHistory: string | null;
  loading: boolean;
  onEdit: () => void;
  showForm: boolean;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  chatHistoryValue: string;
  onChatHistoryChange: (value: string) => void;
  saving: boolean;
}

export default function ChatHistorySection({
  chatHistory,
  loading,
  onEdit,
  showForm,
  onSave,
  onCancel,
  chatHistoryValue,
  onChatHistoryChange,
  saving,
}: ChatHistorySectionProps) {
  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(196, 183, 91, 0.2)', paddingTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History size={20} color="var(--imperial-emerald)" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
            LinkedIn Conversation Archive
          </h3>
        </div>
        {!showForm && !loading && (
          <button
            onClick={onEdit}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.8125rem', 
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(196, 183, 91, 0.3)',
              background: 'white',
              color: 'var(--imperial-emerald)',
              cursor: 'pointer'
            }}
          >
            <Edit2 size={14} />
            {chatHistory ? 'Update Logs' : 'Initial Import'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" />
        </div>
      ) : showForm ? (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={chatHistoryValue}
              onChange={(e) => onChatHistoryChange(e.target.value)}
              placeholder="Paste LinkedIn chat logs here..."
              style={{ 
                width: '100%', 
                minHeight: '200px',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(196, 183, 91, 0.4)',
                background: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                color: 'var(--imperial-emerald)',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '700'
              }}
            >
              <Save size={16} />
              {saving ? 'Syncing...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>
      ) : chatHistory ? (
        <div style={{ 
          background: 'rgba(196, 183, 91, 0.03)', 
          borderRadius: '0.75rem',
          border: '1px solid rgba(196, 183, 91, 0.15)',
          padding: '1.25rem',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            color: 'var(--imperial-emerald)', 
            lineHeight: '1.7', 
            fontFamily: 'monospace', 
            fontSize: '0.875rem' 
          }}>
            {chatHistory}
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          background: 'rgba(196, 183, 91, 0.05)', 
          borderRadius: '1rem',
          border: '1px dashed rgba(196, 183, 91, 0.3)'
        }}>
          <MessageSquare size={32} color="var(--muted-jade)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--muted-jade)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            No historical chat data synchronized for this account.
          </p>
          <button
            onClick={onEdit}
            className="btn-primary"
            style={{ 
              fontSize: '0.875rem', 
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem'
            }}
          >
            Import Chat History
          </button>
        </div>
      )}
    </div>
  );
}

