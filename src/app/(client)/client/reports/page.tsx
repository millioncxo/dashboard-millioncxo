'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Report {
  _id: string;
  type: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  periodStart: string;
  periodEnd: string;
  summary: string;
  metrics: Record<string, any>;
  licenseId?: {
    _id: string;
    label: string;
    serviceType: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function ClientReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    from: '',
    to: '',
  });

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const response = await fetch(`/api/client/reports?${params.toString()}`);
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
  }, [router, filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: '', from: '', to: '' });
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', minHeight: '100vh' }}>
        <div className="card" style={{ background: '#fee2e2', color: '#dc2626', padding: '1.25rem 1.5rem' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--imperial-emerald)' }}>
        Reports
      </h1>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
          Filter Reports
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Report Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              From Date
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              To Date
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="input"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={clearFilters}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="card" style={{ padding: '0', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'linear-gradient(135deg, rgba(196, 183, 91, 0.1) 0%, rgba(196, 183, 91, 0.05) 100%)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
            All Reports ({reports.length})
          </h2>
        </div>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted-jade)' }}>
              No reports available yet. Your reports will appear here once generated.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {reports.map((report) => {
              const typeColors: Record<string, string> = {
                WEEKLY: '#3b82f6',
                MONTHLY: '#10b981',
                QUARTERLY: '#f59e0b',
              };

              return (
                <div
                  key={report._id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid rgba(196, 183, 91, 0.15)',
                    borderLeft: `4px solid ${typeColors[report.type] || 'var(--golden-opal)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedReport(report)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(196, 183, 91, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: `${typeColors[report.type] || 'var(--golden-opal)'}20`,
                            color: typeColors[report.type] || 'var(--golden-opal)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {report.type}
                        </span>
                        {report.licenseId && (
                          <span style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>
                            {report.licenseId.label}
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <strong>Period:</strong> {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                      </p>
                      <p style={{ color: 'var(--imperial-emerald)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                        {report.summary.length > 200 ? `${report.summary.substring(0, 200)}...` : report.summary}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--muted-jade)' }}>
                      <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)' }}>By {report.createdBy.name}</div>
                      <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              padding: '2rem',
              borderRadius: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedReport(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--muted-jade)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            >
              ×
            </button>

            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: 'var(--imperial-emerald)', fontWeight: '700', borderBottom: '2px solid var(--golden-opal)', paddingBottom: '0.75rem' }}>
              Report Details
            </h2>

            <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(196, 183, 91, 0.05)', borderRadius: '1rem', border: '1px solid rgba(196, 183, 91, 0.1)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <span
                  style={{
                    padding: '0.375rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    background: 'var(--golden-opal)',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {selectedReport.type}
                </span>
                {selectedReport.licenseId && (
                  <span style={{ color: 'var(--imperial-emerald)', fontWeight: '600' }}>
                    Service: {selectedReport.licenseId.label}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--muted-jade)' }}>
                  <strong>Period:</strong> {new Date(selectedReport.periodStart).toLocaleDateString()} - {new Date(selectedReport.periodEnd).toLocaleDateString()}
                </p>
                <p style={{ color: 'var(--muted-jade)' }}>
                  <strong>SDR:</strong> {selectedReport.createdBy.name}
                </p>
                <p style={{ color: 'var(--muted-jade)' }}>
                  <strong>Generated:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                Executive Summary
              </h3>
              <div style={{ 
                color: 'var(--imperial-emerald)', 
                lineHeight: '1.8', 
                whiteSpace: 'pre-wrap', 
                padding: '1.5rem', 
                background: 'white', 
                borderRadius: '0.75rem', 
                border: '1px solid rgba(196, 183, 91, 0.2)',
                fontSize: '1rem'
              }}>
                {selectedReport.summary}
              </div>
            </div>

            {selectedReport.metrics && Object.keys(selectedReport.metrics).length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                  Performance Metrics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {Object.entries(selectedReport.metrics).map(([key, value]) => (
                    <div key={key} style={{ 
                      padding: '1rem', 
                      background: 'white', 
                      borderRadius: '0.75rem', 
                      border: '1px solid rgba(196, 183, 91, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <span style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>{key}</span>
                      <span style={{ color: 'var(--imperial-emerald)', fontSize: '1.25rem', fontWeight: '700' }}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

