'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoComponent from './LogoComponent';
import { Menu, X, ChevronDown, LogOut, User } from 'lucide-react';

const NAV_LINKS = {
  ADMIN: [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Team Members' },
    { href: '/admin/clients', label: 'Clients' },
    { href: '/admin/assignments', label: 'SDR Assignments' },
    { href: '/admin/invoices', label: 'Invoices' },
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/plans', label: 'Plans' },
  ],
  SDR: [
    { href: '/sdr', label: 'Dashboard' },
    { href: '/sdr/messages', label: 'Messages' },
    { href: '/sdr/clients', label: 'My Clients' },
    { href: '/sdr/reports', label: 'Reports' },
  ],
  CLIENT: [
    { href: '/client', label: 'Dashboard' },
    { href: '/client/chat', label: 'Messages' },
    { href: '/client/plan', label: 'Plan' },
    { href: '/client/reports', label: 'Reports' },
    { href: '/client/billing', label: 'Billing' },
  ],
} as const;

const ROOT_PATHS = ['/admin', '/sdr', '/client'];

function isActive(href: string, pathname: string): boolean {
  if (ROOT_PATHS.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

interface NavbarProps {
  role: 'ADMIN' | 'SDR' | 'CLIENT';
  user?: { name?: string; email?: string } | null;
}

export default function Navbar({ role, user: userProp }: NavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(userProp ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const links = NAV_LINKS[role];

  useEffect(() => {
    if (userProp !== undefined) {
      setUser(userProp);
      return;
    }
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setUser({ name: data.user.name, email: data.user.email });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userProp]);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobile && drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobile, drawerOpen]);

  const handleLogout = async () => {
    setAccountOpen(false);
    setDrawerOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const displayName = user?.name || user?.email || 'Account';

  const barStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.75rem 1.5rem',
    background: 'var(--imperial-emerald)',
    color: 'var(--ivory-silk)',
    borderBottom: '1px solid rgba(196, 183, 91, 0.25)',
    flexWrap: 'wrap',
  };

  const linkStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 500,
    background: active ? 'var(--golden-opal)' : 'transparent',
    color: active ? 'var(--onyx-black)' : 'var(--ivory-silk)',
    transition: 'all 0.2s ease',
  });

  const navLinks = (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
      {links.map((link) => {
        const active = isActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            style={linkStyle(active)}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'rgba(196, 183, 91, 0.2)';
                e.currentTarget.style.color = 'var(--golden-opal)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--ivory-silk)';
              }
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const accountDropdown = (
    <div ref={accountRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAccountOpen((o) => !o)}
        aria-expanded={accountOpen}
        aria-label="Account menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: accountOpen ? 'rgba(196, 183, 91, 0.2)' : 'transparent',
          color: 'var(--ivory-silk)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        <User size={18} />
        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
        <ChevronDown size={16} style={{ flexShrink: 0, transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {accountOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            minWidth: '200px',
            padding: '0.5rem',
            background: 'var(--ivory-silk)',
            color: 'var(--imperial-emerald)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          {user?.name && (
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
              {user.name}
            </div>
          )}
          {user?.email && (
            <div style={{ padding: '0 0.75rem 0.5rem', fontSize: '0.75rem', color: 'var(--muted-jade)' }}>
              {user.email}
            </div>
          )}
          <div style={{ height: 1, background: 'rgba(11, 46, 43, 0.1)', margin: '0.25rem 0' }} />
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: 'none',
              borderRadius: '0.375rem',
              background: 'transparent',
              color: 'var(--imperial-emerald)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header style={barStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LogoComponent width={40} height={22} hoverGradient={true} />
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--golden-opal)' }}>
            MillionCXO
          </span>
        </div>

        {!mobile && navLinks}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!mobile && accountDropdown}
          {mobile && (
            <button
              type="button"
              onClick={() => setDrawerOpen((o) => !o)}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              style={{
                padding: '0.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: 'var(--ivory-silk)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {drawerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </header>

      {mobile && drawerOpen && (
        <>
          <div
            role="presentation"
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 9998,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(320px, 85vw)',
              background: 'var(--imperial-emerald)',
              color: 'var(--ivory-silk)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1rem', borderBottom: '1px solid rgba(196, 183, 91, 0.2)' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--golden-opal)' }}>Menu</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ivory-silk)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="navbar-drawer-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '1rem' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {links.map((link) => {
                  const active = isActive(link.href, pathname);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      style={{
                        ...linkStyle(active),
                        display: 'block',
                        padding: '0.75rem 1rem',
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196, 183, 91, 0.25)' }}>
                {user?.name && (
                  <div style={{ padding: '0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
                )}
                {user?.email && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginBottom: '0.5rem' }}>{user.email}</div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(196, 183, 91, 0.4)',
                    borderRadius: '0.5rem',
                    background: 'transparent',
                    color: 'var(--ivory-silk)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
