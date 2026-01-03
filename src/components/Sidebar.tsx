'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoComponent from './LogoComponent';

interface SidebarProps {
  role: 'ADMIN' | 'SDR' | 'CLIENT';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', ariaLabel: 'Go to admin dashboard' },
    { href: '/admin/users', label: 'Team Members', ariaLabel: 'Manage team members' },
    { href: '/admin/clients', label: 'Clients', ariaLabel: 'Manage clients' },
    { href: '/admin/assignments', label: 'SDR Assignments', ariaLabel: 'Manage SDR assignments' },
    { href: '/admin/invoices', label: 'Invoices', ariaLabel: 'View invoices' },
    { href: '/admin/reports', label: 'Reports', ariaLabel: 'View reports' },
    { href: '/admin/plans', label: 'Plans', ariaLabel: 'Manage plans' },
  ];

  const sdrLinks = [
    { href: '/sdr', label: 'Dashboard', ariaLabel: 'Go to SDR dashboard' },
    { href: '/sdr/messages', label: 'Messages', ariaLabel: 'View client messages' },
    { href: '/sdr/clients', label: 'My Clients', ariaLabel: 'View my clients' },
    { href: '/sdr/reports', label: 'Reports', ariaLabel: 'View reports' },
  ];

  const clientLinks = [
    { href: '/client', label: 'Dashboard', ariaLabel: 'Go to client dashboard' },
    { href: '/client/chat', label: 'Messages', ariaLabel: 'Chat with your SDR' },
    { href: '/client/plan', label: 'Plan', ariaLabel: 'View plan details' },
    { href: '/client/reports', label: 'Reports', ariaLabel: 'View reports' },
    { href: '/client/billing', label: 'Billing', ariaLabel: 'View billing information' },
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'SDR' ? sdrLinks : clientLinks;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // Desktop: Use regular sidebar (mobile handled in layout)
  return (
    <div className="sidebar" style={{ display: 'block' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid rgba(196, 183, 91, 0.3)'
      }}>
        <LogoComponent width={40} height={22} hoverGradient={true} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'var(--golden-opal)',
            lineHeight: '1.2'
          }}>
            MillionCXO
          </span>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--muted-jade)',
            lineHeight: '1.2',
            marginTop: '0.125rem'
          }}>
            Dashboard
          </span>
        </div>
      </div>

      <nav>
        {links.map((link) => {
          // For nested routes, check if pathname starts with the link href
          // But for exact matches like /sdr, only match exactly
          const isActive = link.href === '/sdr' || link.href === '/admin' || link.href === '/client'
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(link.href + '/');
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{
            width: '100%',
            background: 'transparent',
            color: 'var(--ivory-silk)',
            borderColor: 'var(--ivory-silk)'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

