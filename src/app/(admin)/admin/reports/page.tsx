'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { FileText, Download, Calendar, User, Search, Filter, Eye, X, Building2, TrendingUp, CheckCircle2, AlertCircle, BarChart3, PieChart, Users, Mail, ClipboardList } from 'lucide-react';

interface Report {
  _id: string;
  type: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  summary: string;
  metrics?: Record<string, any>;
  inMailsSent?: number;
  inMailsPositiveResponse?: number;
  connectionRequestsSent?: number;
  connectionRequestsPositiveResponse?: number;
  clientId: {
    _id: string;
    businessName: string;
    pointOfContactName?: string;
    pointOfContactEmail?: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  licenseId?: {
    _id: string;
    productOrServiceName: string;
    serviceType: string;
    label: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// Notification Component
const Notification = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div style={{
    position: 'fixed',
    top: '2rem',
    right: '2rem',
    zIndex: 1100,
    background: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '1rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    borderLeft: `4px solid ${type === 'success' ? '#10b981' : '#ef4444'}`,
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    animation: 'slideIn 0.3s ease-out'
  }}>
    {type === 'success' ? <CheckCircle2 size={20} color="#10b981" /> : <AlertCircle size={20} color="#ef4444" />}
    <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{message}</span>
    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-jade)' }}>
      <X size={16} />
    </button>
  </div>
);

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [clients, setClients] = useState<Array<{ _id: string; businessName: string }>>([]);
  const [sdrs, setSdrs] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [reportDetailLoading, setReportDetailLoading] = useState(false);
  
  // Filters
  const [clientFilter, setClientFilter] = useState<string>('');
  const [sdrFilter, setSdrFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const stats = useMemo(() => {
    const totalReports = reports.length;
    const weeklyCount = reports.filter(r => r.type === 'WEEKLY').length;
    const monthlyCount = reports.filter(r => r.type === 'MONTHLY').length;
    const uniqueClients = new Set(reports.map(r => typeof r.clientId === 'object' ? r.clientId._id : r.clientId)).size;

    return [
      { label: 'Total Reports', value: totalReports, icon: ClipboardList, color: 'var(--imperial-emerald)' },
      { label: 'Weekly Reports', value: weeklyCount, icon: BarChart3, color: '#10b981' },
      { label: 'Monthly Insights', value: monthlyCount, icon: PieChart, color: 'var(--golden-opal)' },
      { label: 'Active Clients', value: uniqueClients, icon: Building2, color: 'var(--muted-jade)' },
    ];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.clientId.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (report.createdBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClient = !clientFilter || report.clientId._id === clientFilter;
      const matchesSdr = !sdrFilter || report.createdBy?._id === sdrFilter;
      const matchesType = !typeFilter || report.type === typeFilter;
      
      const matchesDateFrom = !dateFrom || new Date(report.periodStart) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(report.periodStart) <= new Date(new Date(dateTo).setHours(23, 59, 59, 999));
      
      return matchesSearch && matchesClient && matchesSdr && matchesType && matchesDateFrom && matchesDateTo;
    });
  }, [reports, searchTerm, clientFilter, sdrFilter, typeFilter, dateFrom, dateTo]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reports');
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
      showNotification(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, showNotification]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, []);

  const fetchSdrs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?role=SDR');
      if (response.ok) {
        const data = await response.json();
        setSdrs(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch SDRs:', err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchClients();
    fetchSdrs();
  }, [fetchReports, fetchClients, fetchSdrs]);

  const handleExportCSV = () => {
    const headers = ['Type', 'Client', 'SDR', 'Period Start', 'Period End', 'Summary', 'Created Date'];
    const rows = filteredReports.map(report => [
      report.type,
      typeof report.clientId === 'object' ? report.clientId.businessName : 'Unknown',
      report.createdBy?.name || 'N/A',
      new Date(report.periodStart).toLocaleDateString(),
      new Date(report.periodEnd).toLocaleDateString(),
      report.summary.replace(/,/g, ';'), // Replace commas to avoid CSV issues
      new Date(report.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showNotification('Report catalog exported to CSV successfully', 'success');
  };

  const clearFilters = () => {
    setClientFilter('');
    setSdrFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  const handleViewReport = async (reportId: string) => {
    setReportDetailLoading(true);
    setShowReportDetail(true);
    setSelectedReport(null);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch report details');
      }
      const data = await response.json();
      setSelectedReport(data.report);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load report details', 'error');
    } finally {
      setReportDetailLoading(false);
    }
  };

  const closeReportDetail = () => {
    setShowReportDetail(false);
    setSelectedReport(null);
  };

  if (loading && reports.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--ivory-silk)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)'
    }}>
      {notification && <Notification {...notification} onClose={() => setNotification(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ 
          padding: '0.75rem',
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 12px rgba(11, 46, 43, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LogoComponent width={42} height={22} hoverGradient={true} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '800', 
            color: 'var(--imperial-emerald)',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Intelligence Hub
          </h1>
          <p style={{ color: 'var(--muted-jade)', fontSize: '0.9375rem', fontWeight: '500', marginTop: '0.25rem' }}>
            Review performance metrics and strategic insights across the portfolio
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'white',
            color: 'var(--imperial-emerald)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(196, 183, 91, 0.3)',
            fontWeight: '750',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <Download size={18} />
          Export Intelligence
        </button>
      </div>

      {/* KPI Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '1.25rem', 
            boxShadow: '0 4px 20px rgba(11, 46, 43, 0.04)',
            border: '1px solid rgba(196, 183, 91, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '1rem', 
              background: `rgba(${stat.color === 'var(--imperial-emerald)' ? '11, 46, 43' : '16, 185, 129'}, 0.08)`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: stat.color
            }}>
              <stat.icon size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--muted-jade)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--imperial-emerald)', lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ 
        background: 'white', 
        padding: '1.25rem', 
        borderRadius: '1.25rem', 
        border: '1px solid rgba(196, 183, 91, 0.15)',
        boxShadow: '0 4px 12px rgba(11, 46, 43, 0.03)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.75rem',
                border: '1px solid rgba(11, 46, 43, 0.1)', fontSize: '0.875rem', fontWeight: '500', outline: 'none'
              }}
            />
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
              fontSize: '0.875rem', fontWeight: '600', color: 'var(--imperial-emerald)', outline: 'none'
            }}
          >
            <option value="">All Clients</option>
            {clients.map(c => <option key={c._id} value={c._id}>{c.businessName}</option>)}
          </select>
          <select
            value={sdrFilter}
            onChange={(e) => setSdrFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
              fontSize: '0.875rem', fontWeight: '600', color: 'var(--imperial-emerald)', outline: 'none'
            }}
          >
            <option value="">All SDRs</option>
            {sdrs.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
              fontSize: '0.875rem', fontWeight: '600', color: 'var(--imperial-emerald)', outline: 'none'
            }}
          >
            <option value="">All Intervals</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                fontSize: '0.75rem', fontWeight: '600', color: 'var(--imperial-emerald)'
              }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                fontSize: '0.75rem', fontWeight: '600', color: 'var(--imperial-emerald)'
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={clearFilters} style={{ fontSize: '0.8125rem', color: 'var(--muted-jade)', fontWeight: '750', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: '1.5rem', 
        border: '1px solid rgba(196, 183, 91, 0.15)',
        boxShadow: '0 10px 30px rgba(11, 46, 43, 0.04)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(196, 183, 91, 0.1)', background: 'linear-gradient(to right, rgba(196, 183, 91, 0.05), transparent)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '750', margin: 0 }}>Knowledge Repository</h2>
          <p style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500', marginTop: '0.25rem' }}>
            Structured performance narratives and historical execution data
          </p>
        </div>

        {filteredReports.length === 0 ? (
          <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'rgba(11, 46, 43, 0.03)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--muted-jade)'
            }}>
              <FileText size={40} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '750', marginBottom: '0.5rem' }}>No insights found</h3>
            <p style={{ color: 'var(--muted-jade)', maxWidth: '400px', margin: '0 auto' }}>
              We couldn&#39;t locate any reports matching your current configuration. Refine search parameters or view total repository.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis Interval</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Summary</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authored By</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Publication</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr 
                    key={report._id}
                    style={{ borderBottom: '1px solid rgba(196, 183, 91, 0.08)', transition: 'all 0.2s ease', cursor: 'pointer' }}
                    onClick={() => handleViewReport(report._id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <span style={{ 
                        padding: '0.375rem 0.875rem', borderRadius: '2rem', background: 'rgba(196, 183, 91, 0.15)',
                        color: 'var(--imperial-emerald)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase'
                      }}>
                        {report.type}
                      </span>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Building2 size={16} color="var(--imperial-emerald)" />
                        <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>{report.clientId.businessName}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted-jade)', maxWidth: '300px', lineHeight: '1.4' }}>
                        {report.summary.substring(0, 100)}{report.summary.length > 100 ? '...' : ''}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', marginTop: '0.375rem', fontWeight: '600' }}>
                        {new Date(report.periodStart).toLocaleDateString()} — {new Date(report.periodEnd).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      {report.createdBy ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)', fontWeight: '800', fontSize: '0.8125rem' }}>
                            {report.createdBy.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '0.8125rem' }}>{report.createdBy.name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '500' }}>{report.createdBy.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted-jade)', fontStyle: 'italic', fontSize: '0.8125rem' }}>System Generated</span>
                      )}
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <button style={{
                        width: '36px', height: '36px', border: '1px solid rgba(11, 46, 43, 0.1)', background: 'white',
                        borderRadius: '0.625rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease', color: 'var(--imperial-emerald)'
                      }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--imperial-emerald)'; e.currentTarget.style.color = 'white'; }}>
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showReportDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 46, 43, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '2rem'
        }} onClick={closeReportDetail}>
          <div style={{
            background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '900px', maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.75rem 2rem', background: 'linear-gradient(135deg, var(--imperial-emerald) 0%, #064e3b 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Strategic Intelligence Report</h2>
                <p style={{ fontSize: '0.8125rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>
                  {selectedReport ? `${selectedReport.type} Performance Review | ${selectedReport.clientId.businessName}` : 'Retrieving intelligence dossier...'}
                </p>
              </div>
              <button onClick={closeReportDetail} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '2rem', overflow: 'auto', flex: 1 }}>
              {reportDetailLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  <div className="spinner" />
                </div>
              ) : selectedReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  {/* Header Dossier */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem', border: '1px solid rgba(11, 46, 43, 0.05)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Organization</div>
                      <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1rem' }}>{selectedReport.clientId.businessName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>{selectedReport.clientId.pointOfContactName}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem', border: '1px solid rgba(11, 46, 43, 0.05)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Reporting Interval</div>
                      <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1rem' }}>{selectedReport.type} Analysis</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                        {new Date(selectedReport.periodStart).toLocaleDateString()} — {new Date(selectedReport.periodEnd).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem', border: '1px solid rgba(11, 46, 43, 0.05)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Execution Lead</div>
                      <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1rem' }}>{selectedReport.createdBy?.name || 'Automated System'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>{selectedReport.createdBy?.email}</div>
                    </div>
                    {selectedReport.licenseId && (
                      <div style={{ padding: '1rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem', border: '1px solid rgba(11, 46, 43, 0.05)' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Assigned Asset</div>
                        <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1rem' }}>{selectedReport.licenseId.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>{selectedReport.licenseId.serviceType}</div>
                      </div>
                    )}
                  </div>

                  {/* Operational Narrative */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <TrendingUp size={20} color="var(--golden-opal)" />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--imperial-emerald)', margin: 0 }}>Operational Narrative</h3>
                    </div>
                    <div style={{ 
                      padding: '1.5rem', background: 'var(--ivory-silk)', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.2)',
                      fontSize: '0.9375rem', color: 'var(--imperial-emerald)', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontWeight: '500'
                    }}>
                      {selectedReport.summary}
                    </div>
                  </div>

                  {/* LinkedIn Performance Data */}
                  {(selectedReport.inMailsSent || selectedReport.connectionRequestsSent) && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <Users size={20} color="var(--golden-opal)" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--imperial-emerald)', margin: 0 }}>Channel Performance: LinkedIn</h3>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {selectedReport.inMailsSent !== undefined && (
                          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '1.25rem', border: '1px solid rgba(11, 46, 43, 0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>InMail Outreach</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--imperial-emerald)', lineHeight: 1 }}>{selectedReport.inMailsSent}</div>
                              <div style={{ paddingBottom: '0.25rem' }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: '750', color: '#10b981' }}>{selectedReport.inMailsPositiveResponse} Responses</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '600' }}>
                                  {selectedReport.inMailsSent > 0 ? ((selectedReport.inMailsPositiveResponse || 0) / selectedReport.inMailsSent * 100).toFixed(1) : 0}% Conversion
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedReport.connectionRequestsSent !== undefined && (
                          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '1.25rem', border: '1px solid rgba(11, 46, 43, 0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Network Expansion</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--imperial-emerald)', lineHeight: 1 }}>{selectedReport.connectionRequestsSent}</div>
                              <div style={{ paddingBottom: '0.25rem' }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: '750', color: '#10b981' }}>{selectedReport.connectionRequestsPositiveResponse} Acceptances</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '600' }}>
                                  {selectedReport.connectionRequestsSent > 0 ? ((selectedReport.connectionRequestsPositiveResponse || 0) / selectedReport.connectionRequestsSent * 100).toFixed(1) : 0}% Yield
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quantitative Analytics */}
                  {selectedReport.metrics && Object.keys(selectedReport.metrics).length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <BarChart3 size={20} color="var(--golden-opal)" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--imperial-emerald)', margin: 0 }}>Quantitative Analytics</h3>
                      </div>
                      <div style={{ 
                        padding: '1.5rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1.25rem', border: '1px solid rgba(11, 46, 43, 0.05)',
                        fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--imperial-emerald)'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(selectedReport.metrics, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

