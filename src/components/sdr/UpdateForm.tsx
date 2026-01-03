import React from 'react';
import { X, ClipboardList, Calendar, Type, AlignLeft } from 'lucide-react';

interface UpdateFormProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'REPORT' | 'OTHER';
    title: string;
    description: string;
    date: string;
  };
  onFormDataChange: (data: Partial<UpdateFormProps['formData']>) => void;
}

export default function UpdateForm({ show, onClose, onSubmit, formData, onFormDataChange }: UpdateFormProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 46, 43, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
        overflow: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          background: 'white',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(196, 183, 91, 0.1)', 
          borderBottom: '1px solid rgba(196, 183, 91, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.75rem', color: 'var(--imperial-emerald)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: 0, color: 'var(--imperial-emerald)' }}>
                Log Client Activity
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', margin: 0 }}>Create a new update for this client</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'white',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '0.5rem',
              padding: '0.375rem',
              cursor: 'pointer',
              color: 'var(--muted-jade)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'var(--muted-jade)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.5rem', overflow: 'auto' }}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                  Activity Type
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.type}
                    onChange={(e) => onFormDataChange({ type: e.target.value as any })}
                    style={{ 
                      width: '100%',
                      padding: '0.625rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(0,0,0,0.1)',
                      fontSize: '0.9375rem',
                      appearance: 'none',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                    required
                  >
                    <option value="CALL">📞 Call</option>
                    <option value="EMAIL">📧 Email</option>
                    <option value="MEETING">🤝 Meeting</option>
                    <option value="NOTE">📝 Note</option>
                    <option value="REPORT">📊 Report</option>
                    <option value="OTHER">✨ Other</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                  Event Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => onFormDataChange({ date: e.target.value })}
                  style={{ 
                    width: '100%',
                    padding: '0.625rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '0.9375rem',
                    background: 'white'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                Subject / Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onFormDataChange({ title: e.target.value })}
                style={{ 
                  width: '100%',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(0,0,0,0.1)',
                  fontSize: '0.9375rem',
                  background: 'white'
                }}
                required
                placeholder="What was this activity about?"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                Detailed Notes
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormDataChange({ description: e.target.value })}
                style={{ 
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(0,0,0,0.1)',
                  fontSize: '0.9375rem',
                  minHeight: '120px',
                  resize: 'vertical',
                  background: 'white'
                }}
                required
                placeholder="Record the key takeaways and next steps..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ 
                flex: 2,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Confirm & Save Update
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ 
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
