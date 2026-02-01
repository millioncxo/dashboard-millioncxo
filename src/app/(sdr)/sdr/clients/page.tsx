'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import UpdatesTable from '@/components/sdr/UpdatesTable';
import UpdatesTimeline from '@/components/sdr/UpdatesTimeline';
import ViewToggle, { ViewMode } from '@/components/sdr/ViewToggle';
import ClientDetailPanel from '@/components/sdr/ClientDetailPanel';
import UpdateForm from '@/components/sdr/UpdateForm';
import LogoComponent from '@/components/LogoComponent';
import { Users, Search, Filter, ArrowRight, Building2, User, Mail, ShieldCheck, ChevronUp, ArrowUpRight } from 'lucide-react';

interface Client {
  clientId: string;
  businessName: string;
  pointOfContact: {
    name: string;
    title?: string;
    email: string;
    phone?: string;
  };
  licenses: Array<{
    _id: string;
    serviceType: string;
    label: string;
    status: string;
  }>;
  numberOfLicenses: number;
  lastUpdateDate?: string;
}

interface ClientDetails {
  _id: string;
  businessName: string;
  fullRegisteredAddress?: string;
  pointOfContact: {
    name: string;
    title?: string;
    email: string;
    phone?: string;
  };
  websiteAddress?: string;
  country?: string;
  plan?: {
    _id: string;
    name: string;
    pricePerMonth: number;
    creditsPerMonth: number;
    description?: string;
  };
  accountManager?: {
    _id: string;
    name: string;
    email: string;
  };
  numberOfLicenses: number;
  targetThisMonth?: number;
  achievedThisMonth?: number;
  positiveResponsesTarget?: number;
  meetingsBookedTarget?: number;
  targetDeadline?: string;
  licenses: Array<{
    _id: string;
    productOrServiceName: string;
    serviceType: string;
    label: string;
    status: string;
    startDate: string;
    endDate?: string;
    isAssignedToSdr: boolean;
  }>;
  assignmentId: string;
  assignedAt: string;
}

interface Update {
  _id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'REPORT' | 'OTHER';
  title: string;
  description: string;
  date: string;
  sdrId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  attachments?: string[];
}

export default function SdrClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatesView, setUpdatesView] = useState<ViewMode>('table');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [updateFormData, setUpdateFormData] = useState<{
    type: Update['type'];
    title: string;
    description: string;
    date: string;
    chatHistory: string;
  }>({
    type: 'NOTE',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    chatHistory: '',
  });

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/sdr/clients');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data.clients || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const fetchClientDetails = async (clientId: string) => {
    if (expandedClient === clientId && clientDetails) {
      setExpandedClient(null);
      setClientDetails(null);
      setUpdates([]);
      return;
    }

    setLoadingDetails(true);
    try {
      const [detailsResponse, updatesResponse] = await Promise.all([
        fetch(`/api/sdr/clients/${clientId}`),
        fetch(`/api/sdr/clients/${clientId}/updates`),
      ]);

      if (!detailsResponse.ok || !updatesResponse.ok) {
        throw new Error('Failed to fetch client details');
      }

      const detailsData = await detailsResponse.json();
      const updatesData = await updatesResponse.json();

      setClientDetails(detailsData.client);
      setUpdates(updatesData.updates || []);
      setExpandedClient(clientId);
    } catch (err: any) {
      setError(err.message || 'Failed to load client details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedClient) return;

    setError('');
    try {
      const response = await fetch(`/api/sdr/clients/${expandedClient}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create update');
      }

      // Refresh updates
      if (updatesView === 'timeline') {
        const updatesResponse = await fetch(`/api/sdr/clients/${expandedClient}/updates`);
        if (updatesResponse.ok) {
          const updatesData = await updatesResponse.json();
          setUpdates(updatesData.updates || []);
        }
      } else {
        // Trigger table refresh
        setRefreshTrigger(prev => prev + 1);
      }

      // Refresh clients list to update lastUpdateDate
      await fetchClients();

      setShowUpdateForm(false);
      setUpdateFormData({
        type: 'NOTE',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        chatHistory: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create update');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', background: 'var(--ivory-silk)', minHeight: '100vh' }}>
      {/* Header - minimal, no box */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(11, 46, 43, 0.08)' }}>
        <LogoComponent width={48} height={26} hoverGradient={true} />
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.125rem', color: 'var(--imperial-emerald)', letterSpacing: '-0.02em' }}>
            My Clients
          </h1>
          <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>
            Your assigned client portfolio
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#b91c1c', marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Toolbar + table - no card wrapper */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--imperial-emerald)', fontWeight: '700', margin: 0 }}>
            Portfolio ({clients.length})
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: '200px', fontSize: '0.875rem', padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '0.5rem', border: '1px solid rgba(11, 46, 43, 0.12)', background: 'white' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(11, 46, 43, 0.12)', background: 'white', cursor: 'pointer' }}
            >
              <option value="all">All</option>
              <option value="with-updates">With updates</option>
              <option value="no-updates">No updates</option>
            </select>
          </div>
        </div>

        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', color: 'var(--muted-jade)', marginBottom: '0.75rem' }}>
              <Users size={28} />
            </div>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.9375rem', fontWeight: '500' }}>
              No clients assigned yet. Contact your admin to get started.
            </p>
          </div>
        ) : (
                              <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(11, 46, 43, 0.1)' }}>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Organization</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Key Contact</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Licenses</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Activity</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                {clients
                  .filter((client) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      return client.businessName.toLowerCase().includes(query) ||
                             client.pointOfContact.name.toLowerCase().includes(query) ||
                             client.pointOfContact.email.toLowerCase().includes(query);
                    }
                    if (filterStatus === 'with-updates' && !client.lastUpdateDate) return false;
                    if (filterStatus === 'no-updates' && client.lastUpdateDate) return false;
                    return true;
                  })
                  .map((client) => (
                  <React.Fragment key={client.clientId}>
                    <tr 
                      style={{ 
                        borderBottom: '1px solid rgba(11, 46, 43, 0.06)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        background: expandedClient === client.clientId ? 'rgba(11, 46, 43, 0.03)' : 'transparent'
                      }}
                      onClick={() => fetchClientDetails(client.clientId)}
                      onMouseEnter={(e) => {
                        if (expandedClient !== client.clientId) e.currentTarget.style.background = 'rgba(11, 46, 43, 0.02)';
                      }}
                      onMouseLeave={(e) => {
                        if (expandedClient !== client.clientId) e.currentTarget.style.background = '';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)', fontWeight: '700', fontSize: '0.875rem' }}>
                            {client.businessName.charAt(0)}
                          </div>
                          <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>
                            {client.businessName}
                          </div>
                        </div>
                                        </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{client.pointOfContact.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)' }}>{client.pointOfContact.email}</span>
                        </div>
                                        </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(11, 46, 43, 0.05)', color: 'var(--imperial-emerald)', fontWeight: '600', fontSize: '0.75rem' }}>
                            {client.numberOfLicenses || 0} Licenses
                                          </span>
                        </div>
                                        </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--muted-jade)', fontSize: '0.8125rem' }}>
                          {client.lastUpdateDate ? (
                            <>
                              <ShieldCheck size={14} color="#10b981" />
                              <span>{new Date(client.lastUpdateDate).toLocaleDateString()}</span>
                            </>
                          ) : (
                            <span style={{ opacity: 0.6, fontStyle: 'italic' }}>No activity logged</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {expandedClient === client.clientId ? (
                          <button
                            type="button"
                            onClick={() => fetchClientDetails(client.clientId)}
                            style={{ background: 'none', border: 'none', color: 'var(--golden-opal)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}
                          >
                            Hide Workspace <ChevronUp size={14} />
                          </button>
                        ) : (
                          <a
                            href={`/sdr/clients/${client.clientId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--golden-opal)', textDecoration: 'none', cursor: 'pointer' }}
                            title="Open workspace"
                          >
                            Open Workspace <ArrowUpRight size={14} />
                          </a>
                        )}
                      </td>
                                      </tr>

                    {/* Expanded Workspace */}
                    {expandedClient === client.clientId && (
                      <tr key={`${client.clientId}-workspace`}>
                        <td colSpan={5} style={{ padding: '1rem 1.5rem', background: 'rgba(11, 46, 43, 0.02)' }}>
                          <div style={{ padding: '1.25rem', position: 'relative' }}>
                            {/* Workspace header - minimal */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(11, 46, 43, 0.06)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Building2 size={18} color="var(--imperial-emerald)" />
                                <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
                                  {client.businessName} Workspace
                                </h3>
                              </div>
                              <button 
                                onClick={() => setExpandedClient(null)}
                                style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: 'rgba(0,0,0,0.04)', cursor: 'pointer', color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600' }}
                              >
                                Close
                              </button>
                            </div>

                            <ClientDetailPanel clientDetails={clientDetails} loading={loadingDetails} />

                            {/* Activity Section */}
                            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(11, 46, 43, 0.06)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
                                    Workspace Activity Logs
                              </h3>
                              <ViewToggle currentView={updatesView} onViewChange={setUpdatesView} />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowUpdateForm(!showUpdateForm);
                              }}
                              className="btn-primary"
                                  style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}
                            >
                                  + Log Activity
                            </button>
                          </div>
                          {updatesView === 'table' ? (
                            <UpdatesTable 
                              clientId={expandedClient!}
                              refreshTrigger={refreshTrigger}
                            />
                          ) : (
                            <UpdatesTimeline updates={updates} />
                          )}
                        </div>
                      </div>
                        </td>
                      </tr>
                )}
                  </React.Fragment>
            ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modernized Add Update Modal */}
      <UpdateForm
        show={showUpdateForm}
        onClose={() => setShowUpdateForm(false)}
        onSubmit={handleAddUpdate}
        formData={{
          type: updateFormData.type,
          title: updateFormData.title,
          description: updateFormData.description,
          date: updateFormData.date
        }}
        onFormDataChange={(data) => setUpdateFormData({ ...updateFormData, ...data })}
      />
    </div>
  );
}
