'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReportsTable from '@/components/sdr/ReportsTable';
import LogoComponent from '@/components/LogoComponent';
import { FileText, Plus, X, Calendar, User, ShieldCheck, BarChart3, Info } from 'lucide-react';

interface Report {
  _id: string;
  clientId: {
    _id: string;
    businessName: string;
  };
  licenseId?: {
    _id: string;
    label: string;
    serviceType: string;
    productOrServiceName?: string;
  };
  type: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  periodStart: string;
  periodEnd: string;
  summary: string;
  metrics: Record<string, any>;
  inMailsSent?: number;
  inMailsPositiveResponse?: number;
  connectionRequestsSent?: number;
  connectionRequestsPositiveResponse?: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Client {
  clientId: string;
  businessName: string;
}

interface License {
  _id: string;
  productOrServiceName: string;
  serviceType: string;
  label: string;
}

export default function SdrReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [licenses, setLicenses] = useState<Record<string, License[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState({
    clientId: '',
    licenseId: '',
    type: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
    periodStart: '',
    periodEnd: '',
    summary: '',
    metrics: {} as Record<string, any>,
    inMailsSent: '',
    inMailsPositiveResponse: '',
    connectionRequestsSent: '',
    connectionRequestsPositiveResponse: '',
  });

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/sdr/reports');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/sdr/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (err: any) {
      // Silently handle client fetch errors for reports page
    }
  }, []);

  const fetchLicensesForClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/sdr/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setLicenses(prev => ({
          ...prev,
          [clientId]: data.client.licenses || [],
        }));
      }
    } catch (err: any) {
      // Silently handle license fetch errors
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, clientId, licenseId: '' });
    if (clientId) {
      fetchLicensesForClient(clientId);
    }
  };

  const handleTypeChange = (type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY') => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'DAILY') {
      // For daily reports, set both dates to today
      setFormData({ ...formData, type, periodStart: today, periodEnd: today });
    } else {
      setFormData({ ...formData, type });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/sdr/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          licenseId: formData.licenseId || undefined,
          type: formData.type,
          periodStart: formData.periodStart,
          periodEnd: formData.periodEnd,
          summary: formData.summary,
          metrics: formData.metrics,
          inMailsSent: formData.inMailsSent ? parseInt(formData.inMailsSent) : undefined,
          inMailsPositiveResponse: formData.inMailsPositiveResponse ? parseInt(formData.inMailsPositiveResponse) : undefined,
          connectionRequestsSent: formData.connectionRequestsSent ? parseInt(formData.connectionRequestsSent) : undefined,
          connectionRequestsPositiveResponse: formData.connectionRequestsPositiveResponse ? parseInt(formData.connectionRequestsPositiveResponse) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create report');
      }

      setRefreshTrigger(prev => prev + 1);
      setShowForm(false);
      setFormData({
        clientId: '',
        licenseId: '',
        type: 'DAILY',
        periodStart: '',
        periodEnd: '',
        summary: '',
        metrics: {},
        inMailsSent: '',
        inMailsPositiveResponse: '',
        connectionRequestsSent: '',
        connectionRequestsPositiveResponse: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create report');
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
              Activity Reports
            </h1>
            <p style={{ 
              color: 'var(--muted-jade)', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Generate and manage client performance reports
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700' }}
        >
          <Plus size={18} />
          Create Report
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee2e2', color: '#dc2626', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Modernized Report Form Modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 46, 43, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            overflow: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              background: 'white',
              borderRadius: '1.25rem',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '1.5rem', 
              background: 'rgba(196, 183, 91, 0.1)', 
              borderBottom: '1px solid rgba(196, 183, 91, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.75rem', color: 'var(--imperial-emerald)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: 0, color: 'var(--imperial-emerald)' }}>
                    New Performance Report
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', margin: 0 }}>Capture client progress and LinkedIn metrics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: '0.5rem',
                  padding: '0.375rem',
                  cursor: 'pointer',
                  color: 'var(--muted-jade)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = 'var(--muted-jade)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflow: 'auto' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Basic Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Target Client
                    </label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9375rem', background: 'white' }}
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client.clientId} value={client.clientId}>
                          {client.businessName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Reporting Interval
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value as any)}
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9375rem', background: 'white' }}
                      required
                    >
                      <option value="DAILY">Daily Update</option>
                      <option value="WEEKLY">Weekly Report</option>
                      <option value="MONTHLY">Monthly Review</option>
                      <option value="QUARTERLY">Quarterly Strategy</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Associated License
                    </label>
                    <select
                      value={formData.licenseId}
                      onChange={(e) => setFormData({ ...formData, licenseId: e.target.value })}
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9375rem', background: 'white', opacity: !formData.clientId ? 0.6 : 1 }}
                      disabled={!formData.clientId}
                    >
                      <option value="">General Account Report</option>
                      {formData.clientId && licenses[formData.clientId]?.map((license) => (
                        <option key={license._id} value={license._id}>
                          {license.productOrServiceName || license.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Range Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Period Start
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)', pointerEvents: 'none' }} />
                      <input
                        type="date"
                        value={formData.periodStart}
                        onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9375rem' }}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Period End
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)', pointerEvents: 'none' }} />
                      <input
                        type="date"
                        value={formData.periodEnd}
                        onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9375rem' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    Executive Summary
                  </label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9375rem', minHeight: '120px', resize: 'vertical' }}
                    required
                    placeholder="Highlight achievements, challenges, and core outcomes..."
                  />
                </div>

                {/* LinkedIn Metrics Section */}
                <div style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <BarChart3 size={18} color="#3b82f6" />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      LinkedIn Performance Metrics
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-jade)' }}>InMails Sent</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.inMailsSent}
                        onChange={(e) => setFormData({ ...formData, inMailsSent: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.875rem' }}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-jade)' }}>Positive InMail Responses</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.inMailsPositiveResponse}
                        onChange={(e) => setFormData({ ...formData, inMailsPositiveResponse: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.875rem' }}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-jade)' }}>Connections Sent</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.connectionRequestsSent}
                        onChange={(e) => setFormData({ ...formData, connectionRequestsSent: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.875rem' }}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-jade)' }}>Positive Conn. Responses</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.connectionRequestsPositiveResponse}
                        onChange={(e) => setFormData({ ...formData, connectionRequestsPositiveResponse: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.875rem' }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 2, padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.9375rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  Finalize & Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.9375rem', fontWeight: '600', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(196, 183, 91, 0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(196, 183, 91, 0.05)', borderBottom: '1px solid rgba(196, 183, 91, 0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--imperial-emerald)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
            Published Reports Archive
          </h3>
        </div>
        <div style={{ padding: '1rem' }}>
          <ReportsTable refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}

