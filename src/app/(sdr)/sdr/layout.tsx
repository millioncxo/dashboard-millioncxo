'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ResponsiveMenu from '@/components/ResponsiveMenu';

export default function SdrLayout({
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
    { href: '/sdr', label: 'Dashboard' },
    { href: '/sdr/messages', label: 'Messages' },
    { href: '/sdr/clients', label: 'My Clients' },
    { href: '/sdr/reports', label: 'Reports' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ivory-silk)', position: 'relative' }}>
      {!isMobile && <Sidebar role="SDR" />}
      
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

