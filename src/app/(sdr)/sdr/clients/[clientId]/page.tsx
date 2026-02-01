'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import UpdatesTable from '@/components/sdr/UpdatesTable';
import UpdatesTimeline from '@/components/sdr/UpdatesTimeline';
import ViewToggle, { ViewMode } from '@/components/sdr/ViewToggle';
import ClientDetailPanel from '@/components/sdr/ClientDetailPanel';
import UpdateForm from '@/components/sdr/UpdateForm';
import LogoComponent from '@/components/LogoComponent';
import { apiFetch, ApiError } from '@/lib/api-client';
import { ArrowLeft, Building2, ExternalLink } from 'lucide-react';

interface ClientDetails {
  _id: string;
  businessName: string;
  fullRegisteredAddress?: string;
  pointOfContact: { name: string; title?: string; email: string; phone?: string };
  websiteAddress?: string;
  country?: string;
  plan?: { _id: string; name: string; pricePerMonth: number; creditsPerMonth: number; description?: string };
  accountManager?: { _id: string; name: string; email: string };
  numberOfLicenses: number;
  licenses: Array<{ _id: string; productOrServiceName: string; serviceType: string; label: string; status: string; startDate: string; endDate?: string; isAssignedToSdr: boolean }>;
  assignmentId: string;
  assignedAt: string;
}

interface Update {
  _id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'REPORT' | 'OTHER';
  title: string;
  description: string;
  date: string;
  sdrId: { _id: string; name: string; email: string };
  createdAt: string;
}

export default function SdrClientWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId as string;
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState('');
  const [updatesView, setUpdatesView] = useState<ViewMode>('table');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateFormData, setUpdateFormData] = useState<{ type: Update['type']; title: string; description: string; date: string }>({ type: 'NOTE', title: '', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError('');
    try {
      const [detailsRes, updatesRes] = await Promise.all([
        apiFetch(`/api/sdr/clients/${clientId}`),
        apiFetch(`/api/sdr/clients/${clientId}/updates`),
      ]);
      const detailsData = await detailsRes.json();
      const updatesData = await updatesRes.json();
      setClientDetails(detailsData.client);
      setUpdates(updatesData.updates || []);
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
      setLoadingDetails(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setError('');
    try {
      const response = await fetch(`/api/sdr/clients/${clientId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateFormData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create update');
      }
      setRefreshTrigger((p) => p + 1);
      const updatesRes = await apiFetch(`/api/sdr/clients/${clientId}/updates`);
      const updatesData = await updatesRes.json();
      setUpdates(updatesData.updates || []);
      setShowUpdateForm(false);
      setUpdateFormData({ type: 'NOTE', title: '', description: '', date: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      setError(err.message || 'Failed to create update');
    }
  };

  if (!clientId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted-jade)' }}>Invalid client.</p>
        <Link href="/sdr/clients" style={{ color: 'var(--golden-opal)', fontWeight: 600 }}>Back to My Clients</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', minHeight: '100vh' }}>
      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(196, 183, 91, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LogoComponent width={40} height={22} hoverGradient />
            <span style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>/</span>
            <Link
              href="/sdr/clients"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--imperial-emerald)', fontWeight: 600, fontSize: '0.9375rem', textDecoration: 'none' }}
            >
              <ArrowLeft size={16} /> My Clients
            </Link>
            <span style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontWeight: 700, color: 'var(--imperial-emerald)', fontSize: '1rem' }}>
              {clientDetails?.businessName ?? 'Workspace'}
            </span>
          </div>
          <a
            href="/sdr/clients"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(11, 46, 43, 0.2)', background: 'white', color: 'var(--imperial-emerald)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> All clients
          </a>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.9375rem' }}>
          {error}
        </div>
      )}

      {/* Workspace Card */}
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(196, 183, 91, 0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid rgba(196, 183, 91, 0.15)', background: 'rgba(196, 183, 91, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={22} color="var(--imperial-emerald)" />
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--imperial-emerald)' }}>
              {clientDetails?.businessName ?? '—'} Workspace
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowUpdateForm(true)}
            className="btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600 }}
          >
            + Log Activity
          </button>
        </div>

        <div style={{ padding: '1.5rem 1.75rem' }}>
          <ClientDetailPanel clientDetails={clientDetails} loading={loadingDetails} />

          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(196, 183, 91, 0.15)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--imperial-emerald)' }}>
                Activity Logs
              </h2>
              <ViewToggle currentView={updatesView} onViewChange={setUpdatesView} />
            </div>
            {updatesView === 'table' ? (
              <UpdatesTable clientId={clientId} refreshTrigger={refreshTrigger} />
            ) : (
              <UpdatesTimeline updates={updates} />
            )}
          </div>
        </div>
      </div>

      <UpdateForm
        show={showUpdateForm}
        onClose={() => setShowUpdateForm(false)}
        onSubmit={handleAddUpdate}
        formData={updateFormData}
        onFormDataChange={(data) => setUpdateFormData((p) => ({ ...p, ...data }))}
      />
    </div>
  );
}
