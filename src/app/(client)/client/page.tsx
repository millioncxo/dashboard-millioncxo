'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bell, TrendingUp, Activity, CheckCircle2, Circle, ArrowRight, Download, Eye, FileText, ExternalLink } from 'lucide-react';

interface DashboardData {
  client: {
    id: string;
    businessName: string;
    pointOfContact: {
      name: string;
      email: string;
      phone: string;
    };
  };
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
  readByClient?: boolean;
  readAt?: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'unread' | Update['type']>('all');

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/client/dashboard');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/client/updates');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return;
        }
        throw new Error('Failed to fetch updates');
      }
      const result = await response.json();
      setUpdates(result.updates || []);
    } catch (err: any) {
      console.error('Failed to load updates:', err);
    } finally {
      setLoadingUpdates(false);
    }
  }, []);

  const markUpdateAsRead = async (updateId: string) => {
    try {
      const response = await fetch(`/api/client/updates/${updateId}/read`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setUpdates(prevUpdates =>
          prevUpdates.map(update =>
            update._id === updateId
              ? { ...update, readByClient: true, readAt: new Date().toISOString() }
              : update
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark update as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/client/updates/mark-all-read', {
        method: 'PATCH',
      });
      if (response.ok) {
        await fetchUpdates();
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/client/dashboard/stats');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const result = await response.json();
      setStats(result.stats);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchCharts = useCallback(async () => {
    try {
      const response = await fetch('/api/client/dashboard/charts');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return;
        }
        throw new Error('Failed to fetch charts');
      }
      const result = await response.json();
      setChartData(result.charts);
    } catch (err: any) {
      console.error('Failed to load charts:', err);
    } finally {
      setLoadingCharts(false);
    }
  }, []);

  const fetchBilling = useCallback(async () => {
    try {
      const response = await fetch('/api/client/billing');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return;
        }
        throw new Error('Failed to fetch billing');
      }
      const result = await response.json();
      setBillingData(result.billing);
    } catch (err: any) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoadingBilling(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchUpdates();
    fetchStats();
    fetchCharts();
    fetchBilling();
  }, [fetchDashboard, fetchUpdates, fetchStats, fetchCharts, fetchBilling]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ background: '#fee2e2', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--muted-jade)' }}>No data available</p>
      </div>
    );
  }

  const unreadCount = updates.filter(u => !u.readByClient).length;

  const COLORS = {
    CALL: '#3b82f6',
    EMAIL: '#10b981',
    MEETING: '#f59e0b',
    NOTE: '#c4b75b',
    REPORT: '#8b5cf6',
    OTHER: '#6b7280',
  };

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', minHeight: '100vh' }}>
      {/* Header */}
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
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--imperial-emerald)' }}>
              Welcome, {data.client.pointOfContact.name}
            </h1>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
              Your dashboard overview
            </p>
          </div>
        </div>
        {/* Monthly Progress Indicator for Client */}
        {stats?.performance && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            minWidth: '200px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                Monthly Progress
              </span>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                color: stats.performance.status === 'ACHIEVED' ? '#10b981' : stats.performance.status === 'ON_TRACK' ? 'var(--golden-opal)' : '#3b82f6' 
              }}>
                {stats.performance.progressPercent}%
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: 'rgba(11, 46, 43, 0.05)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${Math.min(100, stats.performance.progressPercent)}%`, 
                height: '100%', 
                background: stats.performance.status === 'ACHIEVED' ? '#10b981' : stats.performance.status === 'ON_TRACK' ? 'var(--golden-opal)' : '#3b82f6',
                borderRadius: '4px',
                transition: 'width 1s ease-out'
              }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-jade)', fontWeight: '500', textAlign: 'right' }}>
              {stats.performance.status === 'ACHIEVED' ? 'Goal Achieved' : stats.performance.status === 'ON_TRACK' ? 'On Track' : 'In Progress'}
            </div>
          </div>
        )}
        {unreadCount > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            borderRadius: '0.75rem',
            border: '2px solid rgba(220, 38, 38, 0.2)'
          }}>
            <Bell size={20} color="#dc2626" />
            <div>
              <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '1.125rem' }}>
                {unreadCount} {unreadCount === 1 ? 'Unread Update' : 'Unread Updates'}
              </div>
              <button
                onClick={markAllAsRead}
                style={{
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: '0.25rem'
                }}
              >
                Mark all as read
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Performance Trends Charts */}
      {loadingCharts ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: 'var(--muted-jade)' }}>Loading performance charts...</p>
        </div>
      ) : chartData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Service Utilization Trend */}
          {chartData.serviceUtilization && chartData.serviceUtilization.length > 0 ? (
            <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                Service Utilization Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.serviceUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="active" stroke="#8b5cf6" strokeWidth={2} name="Active Services" />
                  <Line type="monotone" dataKey="total" stroke="var(--golden-opal)" strokeWidth={2} name="Total Services" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                Service Utilization Trend
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--muted-jade)' }}>
                <p>No service utilization data available</p>
              </div>
            </div>
          )}

          {/* Progress Achievement Trend */}
          {chartData.progressTrend && chartData.progressTrend.length > 0 ? (
            <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                Progress Achievement Trend (%)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.progressTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                  <Legend />
                  <Bar dataKey="progress" fill="var(--golden-opal)" name="Progress %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                Progress Achievement Trend
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--muted-jade)' }}>
                <p>No progress data available</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--muted-jade)' }}>No chart data available yet.</p>
        </div>
      )}

      {/* Billing & Payment Summary Section */}
      {loadingBilling ? (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: 'var(--muted-jade)' }}>Loading billing information...</p>
        </div>
      ) : billingData ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
                Billing & Payment Summary
              </h3>
              <button
                onClick={() => router.push('/client/billing')}
                className="btn-secondary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                View All Invoices
                <ArrowRight size={16} />
              </button>
            </div>
            
            {/* Overdue Invoices */}
            {billingData.overdue && billingData.overdue.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.875rem', color: '#dc2626' }}>
                  Overdue Invoices
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {billingData.overdue.map((invoice: any) => (
                    <div
                      key={invoice._id}
                      style={{
                        padding: '0.875rem 1rem',
                        background: 'rgba(220, 38, 38, 0.05)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.4rem', background: 'rgba(220, 38, 38, 0.1)', borderRadius: '0.4rem' }}>
                          <FileText size={16} color="#dc2626" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)', marginBottom: '0.125rem' }}>
                            {invoice.invoiceNumber}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '500' }}>
                            Overdue since {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                          <div style={{ fontWeight: '700', color: '#dc2626', fontSize: '1.125rem' }}>
                            ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        {invoice.fileId && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <a
                              href={`/api/client/invoice/${invoice.fileId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View Invoice"
                              style={{ 
                                padding: '0.4rem', 
                                background: 'white', 
                                border: '1px solid rgba(196, 183, 91, 0.3)', 
                                borderRadius: '0.4rem',
                                color: 'var(--golden-opal)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={`/api/client/invoice/${invoice.fileId}`}
                              download
                              title="Download Invoice"
                              style={{ 
                                padding: '0.4rem', 
                                background: 'white', 
                                border: '1px solid rgba(196, 183, 91, 0.3)', 
                                borderRadius: '0.4rem',
                                color: 'var(--imperial-emerald)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Invoices */}
            {billingData.upcoming && billingData.upcoming.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.875rem', color: 'var(--imperial-emerald)' }}>
                  Upcoming Invoices
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {billingData.upcoming.slice(0, 3).map((invoice: any) => (
                    <div
                      key={invoice._id}
                      style={{
                        padding: '0.875rem 1rem',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.4rem' }}>
                          <FileText size={16} color="#3b82f6" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)', marginBottom: '0.125rem' }}>
                            {invoice.invoiceNumber}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)' }}>
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                          <div style={{ fontWeight: '700', color: '#3b82f6', fontSize: '1.125rem' }}>
                            ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        {invoice.fileId && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <a
                              href={`/api/client/invoice/${invoice.fileId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View Invoice"
                              style={{ 
                                padding: '0.4rem', 
                                background: 'white', 
                                border: '1px solid rgba(196, 183, 91, 0.3)', 
                                borderRadius: '0.4rem',
                                color: 'var(--golden-opal)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={`/api/client/invoice/${invoice.fileId}`}
                              download
                              title="Download Invoice"
                              style={{ 
                                padding: '0.4rem', 
                                background: 'white', 
                                border: '1px solid rgba(196, 183, 91, 0.3)', 
                                borderRadius: '0.4rem',
                                color: 'var(--imperial-emerald)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Paid Invoices */}
            {billingData.history && billingData.history.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.875rem', color: 'var(--imperial-emerald)' }}>
                  Recent Paid Invoices
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {billingData.history.slice(0, 2).map((invoice: any) => (
                    <div
                      key={invoice._id}
                      style={{
                        padding: '0.875rem 1rem',
                        background: 'rgba(16, 185, 129, 0.05)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.4rem' }}>
                          <CheckCircle2 size={16} color="#10b981" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)', marginBottom: '0.125rem' }}>
                            {invoice.invoiceNumber}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)' }}>
                            Paid on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                          <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1.125rem' }}>
                            ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        {invoice.fileId && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <a
                              href={`/api/client/invoice/${invoice.fileId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View Invoice"
                              style={{ 
                                padding: '0.4rem', 
                                background: 'white', 
                                border: '1px solid rgba(196, 183, 91, 0.3)', 
                                borderRadius: '0.4rem',
                                color: 'var(--golden-opal)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={`/api/client/invoice/${invoice.fileId}`}
                              download
                              title="Download Invoice"
                              style={{ 
                                padding: '0.4rem', 
                                background: 'white', 
                                border: '1px solid rgba(196, 183, 91, 0.3)', 
                                borderRadius: '0.4rem',
                                color: 'var(--imperial-emerald)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Status Overview */}
            <div style={{ 
              padding: '0.875rem 1rem',
              background: stats?.billing.overdueCount > 0 
                ? 'rgba(239, 68, 68, 0.1)' 
                : stats?.billing.upcomingCount > 0 
                ? 'rgba(245, 158, 11, 0.1)' 
                : 'rgba(16, 185, 129, 0.1)',
              borderRadius: '0.5rem',
              border: `1px solid ${stats?.billing.overdueCount > 0 
                ? 'rgba(239, 68, 68, 0.3)' 
                : stats?.billing.upcomingCount > 0 
                ? 'rgba(245, 158, 11, 0.3)' 
                : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)', marginBottom: '0.25rem' }}>
                    Payment Health
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
                    {stats?.billing.overdueCount > 0 
                      ? `${stats.billing.overdueCount} overdue invoice${stats.billing.overdueCount > 1 ? 's' : ''}`
                      : stats?.billing.upcomingCount > 0
                      ? `${stats.billing.upcomingCount} upcoming invoice${stats.billing.upcomingCount > 1 ? 's' : ''}`
                      : 'All invoices paid'}
                  </div>
                </div>
                {stats?.billing.nextInvoiceDue && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginBottom: '0.25rem' }}>Next Due</div>
                    <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)' }}>
                      {new Date(stats.billing.nextInvoiceDue).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--muted-jade)' }}>No billing information available.</p>
        </div>
      )}

      {/* Enhanced Recent Activity Timeline with Filters */}
      <div className="card" style={{ padding: '0', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', marginBottom: '1.5rem' }}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'linear-gradient(135deg, rgba(196, 183, 91, 0.1) 0%, rgba(196, 183, 91, 0.05) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.875rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
              Recent Activity
            </h2>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
              {updates.length} {updates.length === 1 ? 'update' : 'updates'} from your SDR
              {unreadCount > 0 && (
                <span style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: '#dc2626',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActivityFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(196, 183, 91, 0.3)',
                background: activityFilter === 'all' ? 'var(--golden-opal)' : 'white',
                color: activityFilter === 'all' ? 'white' : 'var(--imperial-emerald)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              All
            </button>
            <button
              onClick={() => setActivityFilter('unread')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(196, 183, 91, 0.3)',
                background: activityFilter === 'unread' ? '#dc2626' : 'white',
                color: activityFilter === 'unread' ? 'white' : 'var(--imperial-emerald)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Unread
            </button>
            {['CALL', 'EMAIL', 'MEETING', 'REPORT'].map((type) => (
              <button
                key={type}
                onClick={() => setActivityFilter(type as Update['type'])}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(196, 183, 91, 0.3)',
                  background: activityFilter === type ? COLORS[type as keyof typeof COLORS] : 'white',
                  color: activityFilter === type ? 'white' : 'var(--imperial-emerald)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          {loadingUpdates ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div className="spinner" />
            </div>
          ) : updates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <p style={{ color: 'var(--muted-jade)' }}>
                No recent activity. Updates from your SDR will appear here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'rgba(11, 46, 43, 0.05)',
                    borderBottom: '2px solid rgba(196, 183, 91, 0.3)'
                  }}>
                    <th style={{ 
                      padding: '0.875rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: 'var(--imperial-emerald)',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '80px'
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      padding: '0.875rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: 'var(--imperial-emerald)',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Type
                    </th>
                    <th style={{ 
                      padding: '0.875rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: 'var(--imperial-emerald)',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Title
                    </th>
                    <th style={{ 
                      padding: '0.875rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: 'var(--imperial-emerald)',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Description
                    </th>
                    <th style={{ 
                      padding: '0.875rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: 'var(--imperial-emerald)',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      SDR
                    </th>
                    <th style={{ 
                      padding: '0.875rem 1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: 'var(--imperial-emerald)',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let filteredUpdates = updates;
                    if (activityFilter === 'unread') {
                      filteredUpdates = updates.filter(u => !u.readByClient);
                    } else if (activityFilter !== 'all') {
                      filteredUpdates = updates.filter(u => u.type === activityFilter);
                    }
                    return filteredUpdates.slice(0, 10).map((update) => {
                    const isUnread = !update.readByClient;

                    return (
                      <tr 
                        key={update._id}
                        style={{
                          borderBottom: '1px solid rgba(196, 183, 91, 0.15)',
                          transition: 'all 0.2s ease',
                          background: isUnread ? 'rgba(220, 38, 38, 0.05)' : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (isUnread) {
                            markUpdateAsRead(update._id);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isUnread ? 'rgba(220, 38, 38, 0.1)' : 'rgba(196, 183, 91, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isUnread ? 'rgba(220, 38, 38, 0.05)' : 'transparent';
                        }}
                      >
                              <td style={{ padding: '0.875rem 1rem' }}>
                          {isUnread ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Circle size={16} color="#dc2626" fill="#dc2626" />
                              <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}>NEW</span>
                            </div>
                          ) : (
                            <CheckCircle2 size={16} color="#10b981" />
                          )}
                        </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: `${COLORS[update.type]}20`,
                              color: COLORS[update.type],
                              textTransform: 'uppercase',
                            }}
                          >
                            {update.type}
                          </span>
                        </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: isUnread ? '700' : '600', color: 'var(--imperial-emerald)' }}>
                            {update.title}
                          </div>
                        </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', lineHeight: '1.6', maxWidth: '400px' }}>
                            {update.description.length > 150 ? `${update.description.substring(0, 150)}...` : update.description}
                          </div>
                        </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
                            {update.sdrId.name}
                          </div>
                          <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem' }}>
                            {update.sdrId.email}
                          </div>
                        </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>
                            {new Date(update.date).toLocaleDateString()}
                          </div>
                          <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem' }}>
                            {(() => {
                              const now = new Date();
                              const updateDate = new Date(update.createdAt);
                              const diffMs = now.getTime() - updateDate.getTime();
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffDays = Math.floor(diffHours / 24);
                              
                              if (diffHours < 1) return 'Just now';
                              if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                              if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                              return updateDate.toLocaleTimeString();
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })})()}
                </tbody>
              </table>
            </div>
          )}
          {updates.length > 10 && (
            <div style={{ padding: '0.875rem 1rem', textAlign: 'center', borderTop: '1px solid rgba(196, 183, 91, 0.2)' }}>
              <button
                onClick={() => {
                  alert('View all updates feature - can be linked to a dedicated page');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.875rem' }}
              >
                View All Updates ({updates.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
