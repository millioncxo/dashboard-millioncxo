'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import StatsCards from '@/components/sdr/StatsCards';
import ClientDetailPanel from '@/components/sdr/ClientDetailPanel';
import ChatHistorySection from '@/components/sdr/ChatHistorySection';
import UpdatesTimeline from '@/components/sdr/UpdatesTimeline';
import UpdatesTable from '@/components/sdr/UpdatesTable';
import ViewToggle, { ViewMode } from '@/components/sdr/ViewToggle';
import UpdateForm from '@/components/sdr/UpdateForm';

interface Client {
  clientId: string;
  businessName: string;
  businessAddress?: string;
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
    productOrServiceName?: string;
    serviceType: string;
    label: string;
    status: string;
    startDate?: string;
    endDate?: string;
  }>;
  assignmentId: string;
  assignedAt: string;
  lastUpdateDate?: string;
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

export default function SdrDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showChatHistoryForm, setShowChatHistoryForm] = useState(false);
  const [chatHistory, setChatHistory] = useState('');
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const [chatHistorySaving, setChatHistorySaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [updatesView, setUpdatesView] = useState<ViewMode>('table');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statsFromApi, setStatsFromApi] = useState<{ totalLicenses: number; activeLicenses: number } | null>(null);
  const [updateFormData, setUpdateFormData] = useState<{
    type: Update['type'];
    title: string;
    description: string;
    date: string;
  }>({
    type: 'NOTE',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
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
      // Update stats from API response if available
      if (data.stats) {
        setStatsFromApi(data.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchClientDetails = async (clientId: string) => {
    if (expandedClient === clientId && clientDetails) {
      setExpandedClient(null);
      setClientDetails(null);
      setUpdates([]);
      setChatHistory('');
      setShowChatHistoryForm(false);
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

      // Fetch chat history
      setChatHistoryLoading(true);
      try {
        const chatResponse = await fetch(`/api/sdr/clients/${clientId}/chat-history`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          setChatHistory(chatData.chatHistory || '');
        }
      } catch (err) {
        // Silently handle chat history fetch errors
      } finally {
        setChatHistoryLoading(false);
      }

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
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create update');
    }
  };

  const handleSaveChatHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedClient) return;

    setChatHistorySaving(true);
    setError('');

    try {
      const response = await fetch(`/api/sdr/clients/${expandedClient}/chat-history`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save chat history');
      }

      setShowChatHistoryForm(false);
      setError(''); // Clear any previous errors
      
      // Show temporary success message
      const successMsg = document.getElementById('success-message');
      if (successMsg) {
        successMsg.style.display = 'block';
        setTimeout(() => {
          if (successMsg) successMsg.style.display = 'none';
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save chat history');
    } finally {
      setChatHistorySaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Use API stats if available, otherwise calculate from clients
  const totalLicenses = statsFromApi?.totalLicenses ?? clients.reduce((sum, c) => sum + (c.licenses?.length || 0), 0);
  const activeLicenses = statsFromApi?.activeLicenses ?? clients.reduce((sum, c) => {
    // Only count licenses that are assigned to this SDR (in the assignment)
    const assignedLicenses = c.licenses?.filter((l: any) => l && l.status === 'active') || [];
    return sum + assignedLicenses.length;
  }, 0);

  return (
    <div style={{ 
      padding: '1.5rem',
      background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        padding: '1.25rem 1.5rem',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LogoComponent width={48} height={26} hoverGradient={true} />
          <div>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '800', 
              marginBottom: '0.125rem', 
              color: 'var(--imperial-emerald)',
              letterSpacing: '-0.02em'
            }}>
              SDR Workspace
            </h1>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>
              Manage your assigned clients and track daily outreach activities
            </p>
          </div>
        </div>
        <div id="success-message" style={{ display: 'none', color: '#10b981', fontWeight: '700', fontSize: '0.875rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
          ✓ Changes saved successfully
        </div>
      </div>

      <StatsCards 
        clientsCount={clients.length} 
        totalLicenses={totalLicenses} 
        activeLicenses={activeLicenses} 
      />

      {error && (
        <div className="card" style={{ background: '#fee2e2', color: '#dc2626', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="card" style={{ 
        padding: '0', 
        borderRadius: '1rem', 
        background: 'white', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(196, 183, 91, 0.15)',
        overflow: 'hidden'
      }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h2 style={{ color: 'var(--imperial-emerald)', fontSize: '1.5rem', fontWeight: '700' }}>No Assigned Clients</h2>
            <p style={{ color: 'var(--muted-jade)', marginTop: '0.5rem' }}>Contact your administrator to receive client assignments.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 46, 43, 0.02)', borderBottom: '2px solid rgba(196, 183, 91, 0.15)' }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '700', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Client Organization
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '700', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Primary Contact
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: '700', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Licenses
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '700', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Activity
                  </th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: '700', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Workspace
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients
                  .filter((client) => {
                    return true;
                  })
                  .map((client) => (
                  <React.Fragment key={client.clientId}>
                    <tr 
                      style={{ 
                        borderBottom: '1px solid rgba(196, 183, 91, 0.1)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        background: expandedClient === client.clientId ? 'rgba(196, 183, 91, 0.05)' : 'transparent'
                      }}
                      onClick={() => fetchClientDetails(client.clientId)}
                      onMouseEnter={(e) => {
                        if (expandedClient !== client.clientId) {
                          e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (expandedClient !== client.clientId) {
                          e.currentTarget.style.background = '';
                        }
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--imperial-emerald)', 
                          fontSize: '0.9375rem'
                        }}>
                          {client.businessName}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: 'var(--imperial-emerald)'
                          }}>
                            {client.pointOfContact.name}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--muted-jade)'
                          }}>
                            {client.pointOfContact.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            background: 'rgba(11, 46, 43, 0.05)',
                            color: 'var(--imperial-emerald)',
                            fontWeight: '600',
                            fontSize: '0.75rem'
                          }}>
                            {client.numberOfLicenses || 0} Total
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                          {client.lastUpdateDate ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                              Last activity: {new Date(client.lastUpdateDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                              No activities logged
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ 
                          display: 'inline-flex',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: expandedClient === client.clientId ? 'var(--imperial-emerald)' : 'transparent',
                          color: expandedClient === client.clientId ? 'white' : 'var(--imperial-emerald)',
                          border: `1px solid ${expandedClient === client.clientId ? 'var(--imperial-emerald)' : 'rgba(11, 46, 43, 0.15)'}`,
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          transition: 'all 0.2s ease'
                        }}>
                          {expandedClient === client.clientId ? 'Active' : 'Open'}
                        </div>
                      </td>
                    </tr>
                    {expandedClient === client.clientId && (
                      <tr>
                        <td colSpan={5} style={{ padding: '0', background: 'rgba(196, 183, 91, 0.02)' }}>
                          <div style={{ 
                            padding: '2rem', 
                            borderBottom: '2px solid rgba(196, 183, 91, 0.1)',
                            animation: 'fadeIn 0.3s ease-out'
                          }}>
                            {/* Workspace Header */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              marginBottom: '2rem',
                              borderBottom: '1px solid rgba(11, 46, 43, 0.05)',
                              paddingBottom: '1rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  borderRadius: '10px', 
                                  background: 'var(--imperial-emerald)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: '800'
                                }}>
                                  {client.businessName.charAt(0)}
                                </div>
                                <div>
                                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
                                    {client.businessName}
                                  </h3>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                                    Client Workspace
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setExpandedClient(null)}
                                style={{ 
                                  padding: '0.5rem', 
                                  borderRadius: '0.5rem', 
                                  border: 'none', 
                                  background: 'rgba(0,0,0,0.03)', 
                                  cursor: 'pointer',
                                  color: 'var(--muted-jade)',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}
                              >
                                Exit Workspace
                              </button>
                            </div>

                            <ClientDetailPanel clientDetails={clientDetails} loading={loadingDetails} />

                            {/* LinkedIn Chat History Section */}
                            <ChatHistorySection
                              chatHistory={chatHistory}
                              loading={chatHistoryLoading}
                              onEdit={() => setShowChatHistoryForm(!showChatHistoryForm)}
                              showForm={showChatHistoryForm}
                              onSave={handleSaveChatHistory}
                              onCancel={() => {
                                setShowChatHistoryForm(false);
                                // Reset to original chat history if cancelled
                                if (expandedClient) {
                                  fetch(`/api/sdr/clients/${expandedClient}/chat-history`)
                                    .then(res => res.json())
                                    .then(data => setChatHistory(data.chatHistory || ''));
                                }
                              }}
                              chatHistoryValue={chatHistory}
                              onChatHistoryChange={setChatHistory}
                              saving={chatHistorySaving}
                            />

                            {/* Updates Section */}
                            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(196, 183, 91, 0.2)', paddingTop: '1.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
                                    Activity & Updates
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
                                  + New Update
                                </button>
                              </div>
                              {updatesView === 'table' ? (
                                <UpdatesTable 
                                  clientId={expandedClient!}
                                  refreshTrigger={refreshTrigger}
                                  onExport={(updates) => {
                                    // Export handled by UpdatesTable component
                                  }}
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
