'use client';

import { useEffect, useState } from 'react';

import { List, Clock } from 'lucide-react';

export type ViewMode = 'table' | 'timeline';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  storageKey?: string;
}

export default function ViewToggle({ currentView, onViewChange, storageKey = 'sdr-updates-view' }: ViewToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved preference
    const saved = localStorage.getItem(storageKey);
    if (saved && (saved === 'table' || saved === 'timeline')) {
      onViewChange(saved as ViewMode);
    }
  }, [storageKey, onViewChange]);

  const handleViewChange = (view: ViewMode) => {
    onViewChange(view);
    if (mounted) {
      localStorage.setItem(storageKey, view);
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div style={{
      display: 'inline-flex',
      padding: '0.25rem',
      background: 'rgba(11, 46, 43, 0.05)',
      borderRadius: '0.625rem',
      gap: '0.25rem'
    }}>
      <button
        type="button"
        onClick={() => handleViewChange('table')}
        style={{
          padding: '0.375rem 0.75rem',
          border: 'none',
          background: currentView === 'table' ? 'white' : 'transparent',
          color: currentView === 'table' ? 'var(--imperial-emerald)' : 'var(--muted-jade)',
          fontWeight: '700',
          cursor: 'pointer',
          fontSize: '0.75rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          transition: 'all 0.2s ease',
          boxShadow: currentView === 'table' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <List size={14} />
        Table
      </button>
      <button
        type="button"
        onClick={() => handleViewChange('timeline')}
        style={{
          padding: '0.375rem 0.75rem',
          border: 'none',
          background: currentView === 'timeline' ? 'white' : 'transparent',
          color: currentView === 'timeline' ? 'var(--imperial-emerald)' : 'var(--muted-jade)',
          fontWeight: '700',
          cursor: 'pointer',
          fontSize: '0.75rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          transition: 'all 0.2s ease',
          boxShadow: currentView === 'timeline' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <Clock size={14} />
        Timeline
      </button>
    </div>
  );
}

