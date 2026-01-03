'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ResponsiveMenu from '@/components/ResponsiveMenu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Team Members' },
    { href: '/admin/clients', label: 'Clients' },
    { href: '/admin/assignments', label: 'SDR Assignments' },
    { href: '/admin/invoices', label: 'Invoices' },
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/plans', label: 'Plans' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ivory-silk)', position: 'relative' }}>
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar role="ADMIN" />}
      
      {/* Mobile Responsive Menu */}
      {isMobile && (
        <ResponsiveMenu items={menuItems} onLogout={handleLogout} />
      )}
      
      <main className="main-content" style={{ 
        flex: 1, 
        padding: '0',
        background: 'var(--ivory-silk)',
        minHeight: '100vh',
        width: '100%'
      }}>
        {children}
      </main>
    </div>
  );
}

