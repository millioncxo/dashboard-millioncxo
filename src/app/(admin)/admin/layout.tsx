'use client';

import Navbar from '@/components/Navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory-silk)' }}>
      <Navbar role="ADMIN" />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
