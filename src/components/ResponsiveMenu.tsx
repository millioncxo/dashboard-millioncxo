'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Menu } from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
}

interface ResponsiveMenuProps {
  items: MenuItem[];
  onLogout: () => void;
}

export default function ResponsiveMenu({ items, onLogout }: ResponsiveMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close menu when route changes
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-menu-toggle"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 10001,
          background: 'var(--imperial-emerald)',
          color: 'var(--ivory-silk)',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease'
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* Menu Panel */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(320px, 85vw)',
          background: 'var(--imperial-emerald)',
          zIndex: 10000,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          boxShadow: isOpen ? '-4px 0 24px rgba(0, 0, 0, 0.2)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem'
        }}
      >
        {/* Menu Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)'
        }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'var(--golden-opal)'
          }}>
            Menu
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ivory-silk)',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {items.map((item) => {
            const isActive = item.href === '/admin' || item.href === '/sdr' || item.href === '/client'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'block',
                  padding: '1rem',
                  color: isActive ? 'var(--onyx-black)' : 'var(--ivory-silk)',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  background: isActive ? 'var(--golden-opal)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(196, 183, 91, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div style={{
          paddingTop: '1.5rem',
          borderTop: '2px solid rgba(196, 183, 91, 0.3)'
        }}>
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'transparent',
              color: 'var(--ivory-silk)',
              border: '2px solid var(--ivory-silk)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ivory-silk)';
              e.currentTarget.style.color = 'var(--imperial-emerald)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--ivory-silk)';
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

