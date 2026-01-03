'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, TrendingUp, DollarSign, Activity, Search, Filter, 
  ChevronRight, Download, FileText, CheckCircle2, Clock, 
  AlertCircle, Building2, User, Mail, ExternalLink, X,
  UserPlus, BarChart3, Calendar, Globe, MapPin, Phone, ShieldCheck,
  CreditCard, Layout, List, History, StickyNote
} from 'lucide-react';

interface OverviewRow {
  _id: string;
  businessName: string;
  pointOfContactName: string;
  pointOfContactEmail: string;
  totalLicenses: number;
  totalTarget: number;
  totalAchieved: number;
  assignedSdr?: { _id: string; name: string; email: string } | null;
  lastPaymentDate?: string | null;
  paymentCount?: number;
  achievementStatus?: 'ACHIEVED' | 'IN_PROGRESS' | 'OVERDUE';
  deadlineDate?: string | null;
}

interface OverviewResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: OverviewRow[];
}

interface DetailResponse {
  success: boolean;
  client: {
    id: string;
    businessName: string;
    pointOfContact: {
      name: string;
      title: string | null;
      email: string;
      phone: string | null;
    };
    websiteAddress?: string | null;
    country?: string | null;
    fullRegisteredAddress: string;
    accountManager?: { _id: string; name: string; email: string } | null;
    plan: {
      name: string;
      planType: 'REGULAR' | 'POC' | null;
      pricePerLicense: number | null;
      currency: 'USD' | 'INR';
      numberOfLicenses: number;
      totalCostOfService: number | null;
    };
    paymentStatus?: string;
    paymentDetails?: any;
    targetDeadline?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  licenses: Array<{
    id: string;
    productOrServiceName: string;
    serviceType: string;
    label: string;
    status: string;
    startDate: string;
    endDate: string | null;
  }>;
  assignments: Array<{
    id: string;
    sdr: { id: string; name: string; email: string } | null;
    licenses: string[];
  }>;
  summary: {
    totalLicenses: number;
    totalTarget: number;
    totalAchieved: number;
    achievementStatus?: 'ACHIEVED' | 'IN_PROGRESS' | 'OVERDUE';
    deadlineDate?: string | null;
  };
  paymentHistory?: {
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      invoiceDate: string;
      paymentDate: string | null;
      amount: number;
      currency: string;
      status: string;
      dueDate: string;
      description: string;
      fileId?: string | null;
    }>;
    paymentSummary: {
      totalInvoices: number;
      paidCount: number;
      totalPaid: number;
      lastPaymentDate: string | null;
      paymentDates: string[];
    };
  };
  updates: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    sdr?: { id: string; name: string; email: string } | null;
  }>;
  reports: Array<{
    id: string;
    type: string;
    periodStart: string;
    periodEnd: string;
    summary: string;
    createdBy?: { id: string; name: string; email: string; role?: string } | null;
  }>;
}

interface AdminNote {
  _id: string;
  content: string;
  tag: 'ACCOUNT' | 'BILLING' | 'RISK';
  pinned?: boolean;
  authorId?: { _id: string; name: string; email: string };
  createdAt: string;
}

interface DashboardStats {
  totalClients: number;
  totalSdrs: number;
  activeAssignments: number;
  revenue: {
    total: number;
    thisMonth: number;
    thisYear: number;
    paid: number;
    outstanding: number;
  };
  invoices: {
    total: number;
    active: number;
    overdue: number;
    paid: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sdrFilter, setSdrFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<'ACCOUNT' | 'BILLING' | 'RISK'>('ACCOUNT');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: string;
    title: string;
    description: string;
    date: string;
    clientId?: string;
    clientName?: string;
  }>>([]);
  const [activityLoading, setActivityLoading] = useState(true);


  const fetchOverview = async (opts?: { page?: number; search?: string; sdrId?: string; status?: string }) => {
    const nextPage = opts?.page ?? page;
    const nextSearch = opts?.search ?? search;
    const nextSdr = opts?.sdrId ?? sdrFilter;
    const nextStatus = opts?.status ?? statusFilter;
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: '10',
    });
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextSdr) params.set('sdrId', nextSdr);
    if (nextStatus) params.set('status', nextStatus);

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/overview?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load overview');
      }
      const data: OverviewResponse = await res.json();
      setRows(data.data || []);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview({ page: 1 });
    fetchDashboardStats();
    fetchChartData();
    fetchRecentActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/dashboard/stats');
      if (!res.ok) {
        throw new Error('Failed to load dashboard statistics');
      }
      const data = await res.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartsLoading(true);
      const res = await fetch('/api/admin/dashboard/charts?months=12');
      if (!res.ok) {
        throw new Error('Failed to load chart data');
      }
      const data = await res.json();
      setChartData(data.charts);
    } catch (err: any) {
      console.error('Failed to fetch chart data:', err);
    } finally {
      setChartsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const res = await fetch('/api/admin/dashboard/activity?limit=20');
      if (!res.ok) {
        throw new Error('Failed to load activity feed');
      }
      const data = await res.json();
      setRecentActivity(data.activities || []);
    } catch (err: any) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const uniqueSdrs = useMemo(() => {
    const map = new Map<string, { _id: string; name: string; email: string }>();
    rows.forEach((r) => {
      if (r.assignedSdr?._id) {
        map.set(r.assignedSdr._id, r.assignedSdr);
      }
    });
    return Array.from(map.values());
  }, [rows]);

  const totalLicensesAgg = rows.reduce((sum, r) => sum + (r.totalLicenses || 0), 0);
  const totalTargetsAgg = rows.reduce((sum, r) => sum + (r.totalTarget || 0), 0);
  const totalAchievedAgg = rows.reduce((sum, r) => sum + (r.totalAchieved || 0), 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOverview({ page: 1, search });
  };

  const handleSdrFilter = (value: string) => {
    setSdrFilter(value);
    fetchOverview({ page: 1, sdrId: value });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    fetchOverview({ page: nextPage });
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setShowDetail(true);
    setDetail(null);
    setDetailError('');
    setNotes([]);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/overview/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load detail');
      }
      const data: DetailResponse = await res.json();
      setDetail(data);
      fetchNotes(id);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedId(null);
    setDetail(null);
    setDetailError('');
  };


  const fetchNotes = async (clientId: string) => {
    try {
      setNotesLoading(true);
      const res = await fetch(`/api/admin/clients/${clientId}/notes`);
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      // ignore silently for now
    } finally {
      setNotesLoading(false);
    }
  };

  const addNote = async () => {
    if (!selectedId || !newNoteContent.trim()) return;
    try {
      const res = await fetch(`/api/admin/clients/${selectedId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteContent.trim(),
          tag: newNoteTag,
          pinned: newNotePinned,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add note');
      }
      setNewNoteContent('');
      setNewNotePinned(false);
      await fetchNotes(selectedId);
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)',
      padding: '1.5rem'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: '1rem', 
        marginBottom: '2rem',
        background: 'white',
        padding: '1.25rem 1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 2px 12px rgba(11, 46, 43, 0.04)',
        border: '1px solid rgba(196, 183, 91, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <LogoComponent width={42} height={24} hoverGradient={true} />
          <div>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '800', 
              color: 'var(--imperial-emerald)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Admin Workspace
          </h1>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>
              Full visibility across clients, SDRs, and performance targets
          </p>
          </div>
        </div>
        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/admin/export/clients?format=csv');
              if (!response.ok) throw new Error('Failed to export');
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (err: any) {
              setError(err.message || 'Failed to export clients');
            }
          }}
          className="btn-secondary"
          style={{ 
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          <Download size={16} />
          Export Clients (CSV)
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          border: '1px solid #fecaca',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* KPI Summary Cards */}
      {!statsLoading && stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1px solid rgba(196, 183, 91, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              background: 'rgba(11, 46, 43, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--imperial-emerald)'
            }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Clients</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--imperial-emerald)' }}>
              {stats.totalClients}
            </div>
          </div>
            </div>

          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1px solid rgba(196, 183, 91, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              background: 'rgba(196, 183, 91, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--imperial-emerald)'
            }}>
              <TrendingUp size={20} />
          </div>
            <div>
              <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--imperial-emerald)' }}>
                ${stats.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1px solid rgba(196, 183, 91, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              background: 'rgba(11, 46, 43, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--imperial-emerald)'
            }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total SDRs</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--imperial-emerald)' }}>
              {stats.totalSdrs}
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'white',
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1px solid rgba(196, 183, 91, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              background: 'rgba(16, 185, 129, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Monthly Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>
                ${stats.revenue.thisMonth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!chartsLoading && chartData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Revenue Trend Chart */}
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '1.25rem',
            border: '1px solid rgba(196, 183, 91, 0.15)',
            boxShadow: '0 4px 20px rgba(11, 46, 43, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'rgba(11, 46, 43, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--imperial-emerald)'
              }}>
                <TrendingUp size={18} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--imperial-emerald)' }}>
                Revenue Trend
            </h3>
            </div>
            {chartData.revenueTrend && chartData.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData.revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11, 46, 43, 0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--muted-jade)"
                    style={{ fontSize: '0.75rem', fontWeight: '500' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--muted-jade)"
                    style={{ fontSize: '0.75rem', fontWeight: '500' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => `$${(value/1000)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '1px solid rgba(196, 183, 91, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      boxShadow: '0 10px 25px rgba(11, 46, 43, 0.08)',
                      backdropFilter: 'blur(4px)'
                    }}
                    itemStyle={{ fontSize: '0.875rem', fontWeight: '600', padding: '0.25rem 0' }}
                    labelStyle={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted-jade)', marginBottom: '0.5rem', textTransform: 'uppercase' }}
                    formatter={(value: number | undefined) => {
                      if (value === undefined) return ['$0.00', ''];
                      return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ''];
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    wrapperStyle={{ paddingBottom: '2rem', fontSize: '0.75rem', fontWeight: '600' }}
                    iconType="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--imperial-emerald)" 
                    strokeWidth={4}
                    dot={{ fill: 'var(--imperial-emerald)', r: 4, strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Total Revenue" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Paid Revenue" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px', color: 'var(--muted-jade)', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem' }}>
                <p style={{ fontWeight: '500' }}>No revenue data available</p>
              </div>
            )}
          </div>

          {/* Client Growth Chart */}
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '1.25rem',
            border: '1px solid rgba(196, 183, 91, 0.15)',
            boxShadow: '0 4px 20px rgba(11, 46, 43, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'rgba(11, 46, 43, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--imperial-emerald)'
              }}>
                <Users size={18} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--imperial-emerald)' }}>
                Client Growth
            </h3>
            </div>
            {chartData.clientGrowth && chartData.clientGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData.clientGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11, 46, 43, 0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--muted-jade)"
                    style={{ fontSize: '0.75rem', fontWeight: '500' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--muted-jade)"
                    style={{ fontSize: '0.75rem', fontWeight: '500' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '1px solid rgba(196, 183, 91, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      boxShadow: '0 10px 25px rgba(11, 46, 43, 0.08)',
                      backdropFilter: 'blur(4px)'
                    }}
                    itemStyle={{ fontSize: '0.875rem', fontWeight: '600', padding: '0.25rem 0' }}
                    labelStyle={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted-jade)', marginBottom: '0.5rem', textTransform: 'uppercase' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    wrapperStyle={{ paddingBottom: '2rem', fontSize: '0.75rem', fontWeight: '600' }}
                    iconType="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalClients" 
                    stroke="var(--imperial-emerald)" 
                    strokeWidth={4}
                    dot={{ fill: 'var(--imperial-emerald)', r: 4, strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Total Clients" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px', color: 'var(--muted-jade)', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem' }}>
                <p style={{ fontWeight: '500' }}>No client data available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      {!activityLoading && (
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '1.25rem',
          border: '1px solid rgba(196, 183, 91, 0.15)',
          boxShadow: '0 4px 20px rgba(11, 46, 43, 0.03)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'rgba(11, 46, 43, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--imperial-emerald)'
            }}>
              <Activity size={18} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--imperial-emerald)' }}>
              Recent Activity
          </h3>
          </div>

          {recentActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {/* Timeline connector line */}
            <div style={{
              position: 'absolute',
              left: '21px',
              top: '10px',
              bottom: '10px',
              width: '2px',
              background: 'rgba(11, 46, 43, 0.05)',
              zIndex: 0
            }} />

            {recentActivity.map((activity, index) => {
              const activityConfig: Record<string, { color: string, icon: any, bg: string }> = {
                INVOICE_GENERATED: { color: '#f59e0b', icon: FileText, bg: '#fef3c7' },
                PAYMENT_RECEIVED: { color: '#10b981', icon: DollarSign, bg: '#d1fae5' },
                CLIENT_CREATED: { color: '#3b82f6', icon: UserPlus, bg: '#dbeafe' },
                CLIENT_UPDATED: { color: '#6366f1', icon: User, bg: '#e0e7ff' },
                SDR_ASSIGNED: { color: '#8b5cf6', icon: Users, bg: '#ede9fe' },
                REPORT_CREATED: { color: '#ec4899', icon: BarChart3, bg: '#fce7f3' },
              };
              
              const config = activityConfig[activity.type] || { color: 'var(--muted-jade)', icon: Activity, bg: 'rgba(11, 46, 43, 0.05)' };
              const Icon = config.icon;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'white',
                    border: `1px solid rgba(196, 183, 91, 0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: config.color,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  
                  <div style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'rgba(11, 46, 43, 0.02)',
                    borderRadius: '0.875rem',
                    border: '1px solid rgba(11, 46, 43, 0.03)',
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                      <span style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>
                      {activity.title}
                    </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600' }}>
                        {new Date(activity.date).toLocaleDateString()} {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', lineHeight: '1.5' }}>
                    {activity.description}
                  </div>
                  {activity.clientName && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--imperial-emerald)', 
                        marginTop: '0.75rem', 
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.625rem',
                        background: 'white',
                        borderRadius: '2rem',
                        border: '1px solid rgba(196, 183, 91, 0.2)'
                      }}>
                        <Building2 size={12} />
                        {activity.clientName}
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-jade)', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: '500' }}>No recent activity in the past 5 hours</p>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        background: 'white', 
        padding: '1.25rem', 
        borderRadius: '1rem', 
        border: '1px solid rgba(196, 183, 91, 0.15)',
        boxShadow: '0 4px 12px rgba(11, 46, 43, 0.03)',
        marginBottom: '1.5rem',
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center' 
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
          <input
            type="text"
              placeholder="Search business or contact name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(11, 46, 43, 0.1)',
                fontSize: '0.9375rem',
                background: 'rgba(11, 46, 43, 0.01)',
                fontWeight: '500'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Filter size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)', pointerEvents: 'none' }} />
          <select
            value={sdrFilter}
            onChange={(e) => handleSdrFilter(e.target.value)}
            style={{
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: '600',
                  color: 'var(--imperial-emerald)',
                  appearance: 'none',
              minWidth: '200px',
                  cursor: 'pointer'
            }}
          >
            <option value="">All SDRs</option>
            {uniqueSdrs.map((sdr) => (
              <option key={sdr._id} value={sdr._id}>
                    {sdr.name}
              </option>
            ))}
          </select>
            </div>

            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)', pointerEvents: 'none' }} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              fetchOverview({ page: 1, status: e.target.value });
            }}
            style={{
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: '600',
                  color: 'var(--imperial-emerald)',
                  appearance: 'none',
                  minWidth: '160px',
                  cursor: 'pointer'
            }}
          >
            <option value="">All Status</option>
            <option value="ACHIEVED">Achieved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="OVERDUE">Overdue</option>
          </select>
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: 'var(--imperial-emerald)',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(11, 46, 43, 0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Search
          </button>
        </form>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '1.25rem', 
        border: '1px solid rgba(196, 183, 91, 0.15)',
        boxShadow: '0 4px 24px rgba(11, 46, 43, 0.04)',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(196, 183, 91, 0.1)',
            background: 'linear-gradient(to right, rgba(196, 183, 91, 0.05), transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '750', letterSpacing: '-0.01em' }}>
            Clients Overview
        </h2>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500', marginTop: '0.25rem' }}>
              {total} total clients registered across all portfolios
            </p>
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: '700', 
            color: 'var(--muted-jade)',
            background: 'rgba(11, 46, 43, 0.05)',
            padding: '0.375rem 0.75rem',
            borderRadius: '2rem'
          }}>
            Page {page} of {totalPages}
          </div>
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'rgba(11, 46, 43, 0.03)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--muted-jade)'
            }}>
              <Search size={32} />
            </div>
            <p style={{ color: 'var(--muted-jade)', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '500' }}>
              No clients found matching your search criteria.
            </p>
            <button 
              onClick={() => {
                setSearch('');
                setSdrFilter('');
                setStatusFilter('');
                fetchOverview({ page: 1, search: '', sdrId: '', status: '' });
              }}
              className="btn-primary" 
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                  {['Business Name', 'Point of Contact', 'Payment History', 'Completion', 'Target / Achieved', 'Assigned SDR', 'Actions'].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: '1.125rem 1.25rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: 'var(--muted-jade)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.075em',
                        borderBottom: '1px solid rgba(196, 183, 91, 0.15)'
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row._id}
                    style={{
                      borderBottom: '1px solid rgba(196, 183, 91, 0.08)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => openDetail(row._id)}
                  >
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>
                        {row.businessName}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{row.pointOfContactName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.125rem' }}>{row.pointOfContactEmail}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {row.paymentCount && row.paymentCount > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ 
                            background: 'rgba(16, 185, 129, 0.1)', 
                            color: '#059669', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>
                            {row.paymentCount} Paid
                          </div>
                          {row.lastPaymentDate && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                              {new Date(row.lastPaymentDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '500', fontStyle: 'italic' }}>
                          No payments
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ width: '100px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)' }}>
                        {row.totalTarget > 0 
                          ? `${Math.round((row.totalAchieved / row.totalTarget) * 100)}%`
                              : row.totalAchieved > 0 ? '100%' : '0%'}
                      </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(11, 46, 43, 0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${row.totalTarget > 0 ? Math.min(100, (row.totalAchieved / row.totalTarget) * 100) : row.totalAchieved > 0 ? 100 : 0}%`, 
                            height: '100%', 
                            background: 'var(--imperial-emerald)',
                            borderRadius: '10px'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{row.totalAchieved || 0}</span>
                        <span style={{ color: 'var(--muted-jade)', fontSize: '0.875rem' }}>/</span>
                        <span style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>{row.totalTarget || 0}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {row.assignedSdr ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: 'var(--imperial-emerald)', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>
                            {row.assignedSdr.name.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>{row.assignedSdr.name}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500' }}>
                          <AlertCircle size={14} />
                          Unassigned
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(row._id);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.625rem',
                          border: '1px solid rgba(196, 183, 91, 0.2)',
                          background: 'white',
                          color: 'var(--imperial-emerald)',
                          fontWeight: '700',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(11, 46, 43, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(11, 46, 43, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = 'rgba(196, 183, 91, 0.2)';
                        }}
                      >
                        Details
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            background: 'rgba(11, 46, 43, 0.01)',
            borderTop: '1px solid rgba(196, 183, 91, 0.1)'
          }}>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(11, 46, 43, 0.1)',
                background: page <= 1 ? 'transparent' : 'white',
                color: page <= 1 ? 'var(--muted-jade)' : 'var(--imperial-emerald)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: page <= 1 ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              Previous
            </button>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: '700', 
              color: 'var(--imperial-emerald)',
              display: 'flex',
              gap: '0.375rem'
            }}>
              <span>{page}</span>
              <span style={{ color: 'var(--muted-jade)' }}>/</span>
              <span style={{ color: 'var(--muted-jade)' }}>{totalPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(11, 46, 43, 0.1)',
                background: page >= totalPages ? 'transparent' : 'white',
                color: page >= totalPages ? 'var(--muted-jade)' : 'var(--imperial-emerald)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: page >= totalPages ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

    {showDetail && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11, 46, 43, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100,
        }}
        onClick={closeDetail}
      >
        <div
          style={{
            width: 'min(900px, 95vw)',
            background: 'var(--ivory-silk)',
            height: '100%',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'var(--imperial-emerald)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white'
              }}>
                <Building2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--imperial-emerald)', letterSpacing: '-0.02em' }}>
                  Client Detail
                </h3>
                <p style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500' }}>
                  Complete view of account performance and billing
                </p>
              </div>
            </div>
            <button
              onClick={closeDetail}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid rgba(196, 183, 91, 0.2)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--muted-jade)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <X size={20} />
            </button>
          </div>

          {detailLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--muted-jade)', fontWeight: '600', fontSize: '0.875rem' }}>Loading client intelligence...</p>
            </div>
          ) : detailError ? (
            <div style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '1.5rem', 
              borderRadius: '1rem',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <AlertCircle size={24} />
              <span style={{ fontWeight: '600' }}>{detailError}</span>
            </div>
          ) : detail ? (
            (() => {
              const d = detail as DetailResponse;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Licenses</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--imperial-emerald)' }}>
                    {d.summary.totalLicenses}
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Target</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--imperial-emerald)' }}>
                    {d.summary.totalTarget}
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Achieved</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>
                    {d.summary.totalAchieved}
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Performance Status</div>
                  {(() => {
                    const status = d.summary.achievementStatus || 'IN_PROGRESS';
                    const statusConfig = {
                      ACHIEVED: { color: '#10b981', bg: '#d1fae5', icon: CheckCircle2, label: 'On Target' },
                      IN_PROGRESS: { color: '#f59e0b', bg: '#fef3c7', icon: Clock, label: 'In Progress' },
                      OVERDUE: { color: '#ef4444', bg: '#fee2e2', icon: AlertCircle, label: 'Overdue' },
                    };
                    const config = statusConfig[status] || statusConfig.IN_PROGRESS;
                    const StatusIcon = config.icon;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '2rem',
                          background: config.bg,
                          color: config.color,
                          fontWeight: '700',
                          fontSize: '0.8125rem',
                          width: 'fit-content'
                        }}>
                          <StatusIcon size={14} />
                        {config.label}
                        </div>
                  {d.summary.deadlineDate && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                      Deadline: {new Date(d.summary.deadlineDate).toLocaleDateString()}
                    </div>
                  )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Information Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                      <Building2 size={18} />
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Company Information</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Business Name</span>
                      <span style={{ fontWeight: '700', color: 'var(--imperial-emerald)' }}>{d.client.businessName}</span>
                  </div>
                  <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Country</span>
                      <span style={{ fontWeight: '700', color: 'var(--imperial-emerald)' }}>{d.client.country || '—'}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Registered Address</span>
                      <span style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{d.client.fullRegisteredAddress || '—'}</span>
                    </div>
                    {d.client.websiteAddress && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Website</span>
                        <a href={d.client.websiteAddress.startsWith('http') ? d.client.websiteAddress : `https://${d.client.websiteAddress}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: '700', color: 'var(--imperial-emerald)', display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none' }}>
                          {d.client.websiteAddress} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                      <User size={18} />
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Key Contact</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Contact Name</span>
                      <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '1.125rem' }}>{d.client.pointOfContact.name}</div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--muted-jade)', fontWeight: '500' }}>{d.client.pointOfContact.title || 'Decision Maker'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Email</span>
                        <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={14} />
                          {d.client.pointOfContact.email}
                        </div>
                      </div>
                    {d.client.pointOfContact.phone && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Phone</span>
                          <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} />
                            {d.client.pointOfContact.phone}
                          </div>
                        </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>

              {/* Plan & Billing Card */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                      <CreditCard size={18} />
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Plan & Account Details</h4>
                  </div>
                  <div style={{ 
                    padding: '0.375rem 0.75rem', 
                    borderRadius: '2rem', 
                    background: 'rgba(11, 46, 43, 0.05)', 
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    {d.client.plan.planType || 'REGULAR'} PLAN
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Active Plan</span>
                    <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)' }}>{d.client.plan.name}</div>
                      </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>License Pricing</span>
                    <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)' }}>
                      {d.client.plan.currency} {d.client.plan.pricePerLicense?.toLocaleString() || '0'} / license
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Total Licenses</span>
                    <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)' }}>{d.client.plan.numberOfLicenses} Seats</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Account Manager</span>
                    <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)' }}>{d.client.accountManager?.name || 'Unassigned'}</div>
                  </div>
                </div>
      </div>

              {/* Licenses Section */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Active Licenses</h4>
                </div>
                {d.licenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '0.75rem' }}>
                    <p style={{ color: 'var(--muted-jade)', fontWeight: '500' }}>No active licenses found.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                          {['Service / Product', 'Type', 'Label', 'Status', 'Start Date'].map((h) => (
                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted-jade)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d.licenses.map((lic) => (
                          <tr key={lic.id} style={{ borderBottom: '1px solid rgba(196, 183, 91, 0.08)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{lic.productOrServiceName}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--muted-jade)' }}>{lic.serviceType}</span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                padding: '0.25rem 0.625rem', 
                                borderRadius: '0.5rem', 
                                background: 'rgba(196, 183, 91, 0.1)', 
                                color: 'var(--imperial-emerald)',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                              }}>
                                {lic.label}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: lic.status === 'ACTIVE' ? '#10b981' : '#f59e0b'
                              }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: lic.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }} />
                                {lic.status}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                              {new Date(lic.startDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Updates Timeline Section */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                    <History size={18} />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Recent Activity Logs</h4>
                </div>
                {d.updates && d.updates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {d.updates.map((u) => (
                      <div key={u.id} style={{ 
                        padding: '1rem', 
                        background: 'rgba(11, 46, 43, 0.02)', 
                        borderRadius: '1rem',
                        border: '1px solid rgba(11, 46, 43, 0.02)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>{u.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600' }}>{new Date(u.date).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', lineHeight: '1.5', marginBottom: '0.75rem' }}>{u.description}</p>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--imperial-emerald)', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}>
                          <User size={12} />
                          {u.sdr ? `${u.sdr.name}` : 'Automated System'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '0.75rem' }}>
                    <p style={{ color: 'var(--muted-jade)', fontWeight: '500' }}>No updates logged for this client yet.</p>
                  </div>
                )}
              </div>

              {/* Payment History Card */}
              {d.paymentHistory && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                      <CreditCard size={18} />
                        </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Payment & Billing History</h4>
              </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '1.5rem',
                    background: 'rgba(11, 46, 43, 0.02)',
                    padding: '1.25rem',
                    borderRadius: '1rem'
                  }}>
                      <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--muted-jade)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Invoiced</span>
                      <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1.25rem' }}>{d.paymentHistory.paymentSummary.totalInvoices}</div>
                      </div>
                      <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--muted-jade)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Fully Paid</span>
                      <div style={{ fontWeight: '800', color: '#10b981', fontSize: '1.25rem' }}>{d.paymentHistory.paymentSummary.paidCount}</div>
                      </div>
                      <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--muted-jade)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Total Value</span>
                      <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1.25rem' }}>
                          {d.paymentHistory.paymentSummary.totalPaid.toLocaleString()} {d.paymentHistory.invoices[0]?.currency || 'USD'}
                        </div>
                      </div>
                          </div>

                  {d.paymentHistory.invoices.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                            {['Invoice #', 'Date', 'Amount', 'Status', 'Download'].map((header) => (
                              <th key={header} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {d.paymentHistory.invoices.map((inv) => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid rgba(196, 183, 91, 0.08)' }}>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{inv.invoiceNumber}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                                {new Date(inv.invoiceDate).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>
                                {inv.amount.toLocaleString()} {inv.currency}
                                </div>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.25rem 0.625rem',
                                  borderRadius: '0.5rem',
                                  background: inv.status === 'PAID' ? '#d1fae5' : inv.status === 'OVERDUE' ? '#fee2e2' : '#fef3c7',
                                  color: inv.status === 'PAID' ? '#10b981' : inv.status === 'OVERDUE' ? '#ef4444' : '#f59e0b',
                                  fontWeight: '700',
                                  fontSize: '0.75rem'
                                }}>
                                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                                  {inv.status}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {inv.fileId ? (
                                  <a
                                    href={`/api/admin/clients/${d.client.id}/invoice/${inv.fileId}`}
                                    download
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.375rem 0.75rem',
                                      borderRadius: '0.5rem',
                                      background: 'white',
                                      border: '1px solid rgba(196, 183, 91, 0.3)',
                                      color: 'var(--imperial-emerald)',
                                      textDecoration: 'none',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                  >
                                    <FileText size={14} />
                                    PDF
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontStyle: 'italic' }}>Not generated</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '0.75rem' }}>
                      <p style={{ color: 'var(--muted-jade)', fontWeight: '500' }}>No invoice history available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Admin Notes */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(196, 183, 91, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                    <StickyNote size={18} />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Internal Portfolio Notes</h4>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1rem', marginBottom: '1.5rem' }}>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Document internal strategy, risks or account updates..."
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '1rem', 
                      border: '1px solid rgba(11, 46, 43, 0.1)', 
                      minHeight: '120px',
                      fontSize: '0.9375rem',
                      background: 'rgba(11, 46, 43, 0.01)',
                      resize: 'vertical',
                      fontWeight: '500'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <select
                      value={newNoteTag}
                      onChange={(e) => setNewNoteTag(e.target.value as any)}
                      style={{ 
                        padding: '0.75rem', 
                        borderRadius: '0.75rem', 
                        border: '1px solid rgba(11, 46, 43, 0.1)',
                        fontWeight: '700',
                        color: 'var(--imperial-emerald)',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ACCOUNT">STRATEGIC ACCOUNT</option>
                      <option value="BILLING">BILLING/FINANCE</option>
                      <option value="RISK">CHURN RISK</option>
                    </select>
                    <div style={{ 
                      padding: '0.75rem', 
                      borderRadius: '0.75rem', 
                      background: 'white', 
                      border: '1px solid rgba(11, 46, 43, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <input type="checkbox" id="pinNote" checked={newNotePinned} onChange={(e) => setNewNotePinned(e.target.checked)} style={{ cursor: 'pointer' }} />
                      <label htmlFor="pinNote" style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--imperial-emerald)', cursor: 'pointer' }}>Pin to top</label>
                    </div>
                    <button
                      onClick={addNote}
                      disabled={!newNoteContent.trim()}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        background: 'var(--imperial-emerald)',
                        color: 'white',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(11, 46, 43, 0.15)',
                        opacity: !newNoteContent.trim() ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Save Note
                    </button>
                  </div>
                </div>

                {notesLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
                ) : notes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(11, 46, 43, 0.02)', borderRadius: '0.75rem' }}>
                    <p style={{ color: 'var(--muted-jade)', fontWeight: '500' }}>No internal notes yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notes.map((n) => (
                      <div
                        key={n._id}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '1rem',
                          border: n.pinned ? '1px solid rgba(196, 183, 91, 0.4)' : '1px solid rgba(11, 46, 43, 0.05)',
                          background: n.pinned ? 'rgba(196, 183, 91, 0.05)' : 'white',
                          position: 'relative',
                          boxShadow: n.pinned ? '0 2px 12px rgba(196, 183, 91, 0.1)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ 
                              padding: '0.25rem 0.625rem', 
                              borderRadius: '2rem', 
                              fontSize: '0.65rem', 
                              fontWeight: '800', 
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: n.tag === 'RISK' ? '#fee2e2' : n.tag === 'BILLING' ? '#fef3c7' : 'rgba(11, 46, 43, 0.05)',
                              color: n.tag === 'RISK' ? '#ef4444' : n.tag === 'BILLING' ? '#f59e0b' : 'var(--imperial-emerald)'
                            }}>
                              {n.tag}
                            </span>
                            {n.pinned && <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--imperial-emerald)', background: 'rgba(196, 183, 91, 0.2)', padding: '0.25rem 0.625rem', borderRadius: '2rem' }}>PINNED</span>}
        </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600' }}>{new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <p style={{ color: 'var(--imperial-emerald)', fontSize: '0.9375rem', fontWeight: '500', lineHeight: '1.6', marginBottom: '1rem' }}>{n.content}</p>
                        {n.authorId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--imperial-emerald)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{(n.authorId as any).name?.charAt(0) || 'A'}</div>
                            By {(n.authorId as any).name || 'Administrator'}
          </div>
                        )}
        </div>
                    ))}
          </div>
                )}
        </div>
            </div>
              );
            })()
          ) : null}
        </div>
      </div>
    )}
    </div>
  );
}
