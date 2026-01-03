'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import ChatInterface from '@/components/sdr/ChatInterface';
import { ArrowLeft } from 'lucide-react';

export default function ClientChatPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const [clientInfo, setClientInfo] = useState<{ businessName: string; pointOfContact: { name: string; email: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        const response = await fetch(`/api/sdr/clients/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.client) {
            setClientInfo({
              businessName: data.client.businessName,
              pointOfContact: data.client.pointOfContact,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching client info:', err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientInfo();
    }
  }, [clientId]);

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <button
          onClick={() => router.push('/sdr/messages')}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            marginRight: '0.5rem'
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <LogoComponent width={48} height={26} hoverGradient={true} />
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '0.25rem', 
            color: 'var(--imperial-emerald)' 
          }}>
            {loading ? 'Loading...' : clientInfo ? `Chat with ${clientInfo.businessName}` : 'Chat'}
          </h1>
          {clientInfo && (
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
              {clientInfo.pointOfContact.name} ({clientInfo.pointOfContact.email})
            </p>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <ChatInterface initialClientId={clientId} hideClientSelector={true} />
      </div>
    </div>
  );
}

