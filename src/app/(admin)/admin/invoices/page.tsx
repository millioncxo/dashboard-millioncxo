'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { 
  Download, FileText, CheckCircle, XCircle, Calendar, 
  DollarSign, Search, Filter, RefreshCw, ChevronRight, 
  Plus, Building2, AlertCircle, FileCheck, Clock, TrendingUp,
  MoreVertical, CheckCircle2, ChevronDown, Activity, Trash2, X
} from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceNumber?: string;
  clientId: {
    _id: string;
    businessName: string;
  };
  invoiceDate?: Date | string;
  dueDate: Date | string;
  amount: number;
  currency: string;
  status: 'GENERATED' | 'PAID' | 'OVERDUE';
  paymentDate?: Date | string | null;
  fileId?: string;
  description?: string;
  createdAt: Date | string;
}

interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueCount: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Array<{ _id: string; businessName: string }>>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Bulk selection
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/invoices');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      console.log('[Invoices Page] Fetched invoices:', data.invoices?.length || 0);
      setInvoices(data.invoices || []);
      setFilteredInvoices(data.invoices || []);
      calculateSummary(data.invoices || []);
    } catch (err: any) {
      console.error('[Invoices Page] Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [fetchInvoices, fetchClients]);

  // Refetch invoices when page becomes visible (user navigates back to page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInvoices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchInvoices]);

  // Apply filters
  useEffect(() => {
    let filtered = [...invoices];

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(inv => inv.clientId._id === clientFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.invoiceDate || inv.createdAt);
        return invDate >= fromDate;
      });
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.invoiceDate || inv.createdAt);
        return invDate <= toDate;
      });
    }

    // Amount range filter
    if (amountMin) {
      const min = parseFloat(amountMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(inv => inv.amount >= min);
      }
    }
    if (amountMax) {
      const max = parseFloat(amountMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(inv => inv.amount <= max);
      }
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.clientId.businessName.toLowerCase().includes(term) ||
        inv.description?.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(filtered);
    calculateSummary(filtered);
  }, [statusFilter, clientFilter, dateFrom, dateTo, amountMin, amountMax, searchTerm, invoices]);


  const calculateSummary = (invoiceList: Invoice[]) => {
    const total = invoiceList.length;
    const totalAmount = invoiceList.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = invoiceList.filter(inv => inv.status === 'PAID');
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const outstandingAmount = totalAmount - paidAmount;
    const overdueCount = invoiceList.filter(inv => inv.status === 'OVERDUE').length;

    setSummary({
      totalInvoices: total,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueCount,
    });
  };

  const handleDownloadInvoice = async (invoiceId: string, fileId: string) => {
    try {
      const invoice = invoices.find(inv => inv._id === invoiceId);
      if (!invoice) return;

      const clientId = typeof invoice.clientId === 'object' ? invoice.clientId._id : invoice.clientId;
      const response = await fetch(`/api/admin/clients/${clientId}/invoice/${fileId}`);
      if (!response.ok) throw new Error('Failed to download invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download invoice');
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark invoice as paid');
      }
      await fetchInvoices();
      alert('Invoice marked as paid successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to mark invoice as paid');
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedInvoices.size === 0) {
      setError('Please select at least one invoice');
      return;
    }

    if (!confirm(`Mark ${selectedInvoices.size} invoice(s) as paid?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const response = await fetch('/api/admin/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceIds: Array.from(selectedInvoices),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark invoices as paid');
      }

      setSelectedInvoices(new Set());
      await fetchInvoices();
      alert(`${selectedInvoices.size} invoice(s) marked as paid successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to mark invoices as paid');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedInvoices.size === 0) {
      setError('Please select at least one invoice');
      return;
    }

    try {
      setBulkActionLoading(true);
      const response = await fetch('/api/admin/invoices/bulk/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceIds: Array.from(selectedInvoices),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download invoices');
      }

      const data = await response.json();
      
      // For now, download files individually since ZIP requires archiver package
      if (data.invoices && data.invoices.length > 0) {
        for (const invoice of data.invoices) {
          try {
            const fileResponse = await fetch(invoice.downloadUrl);
            if (fileResponse.ok) {
              const blob = await fileResponse.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `invoice-${invoice.invoiceNumber || invoice.invoiceId}.pdf`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              // Small delay between downloads
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (err) {
            console.error(`Failed to download invoice ${invoice.invoiceId}:`, err);
          }
        }
        alert(`Downloaded ${data.invoices.length} invoice(s) individually. ZIP download requires archiver package installation.`);
      } else {
        throw new Error('No invoices to download');
      }
      
      setSelectedInvoices(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to download invoices');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv._id)));
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setClientFilter('');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setSearchTerm('');
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
              Billing & Ledger
            </h1>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>
              Financial oversight and invoice lifecycle management
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchInvoices();
            fetchClients();
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
          title="Refresh invoices list"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Synchronize
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
          gap: '0.75rem',
          position: 'relative'
        }}>
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>{error}</div>
          <button
            onClick={() => setError('')}
            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
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
            <FileText size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Invoices</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--imperial-emerald)' }}>{summary.totalInvoices}</div>
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
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Volume</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--imperial-emerald)' }}>
              ${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Paid to Date</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>
              ${summary.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
            background: 'rgba(245, 158, 11, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Outstanding</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b' }}>
              ${summary.outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
            background: 'rgba(239, 68, 68, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Overdue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444' }}>{summary.overdueCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'white', 
        padding: '1.25rem', 
        borderRadius: '1rem', 
        border: '1px solid rgba(196, 183, 91, 0.15)',
        boxShadow: '0 4px 12px rgba(11, 46, 43, 0.03)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Filter size={18} color="var(--imperial-emerald)" />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: '750', color: 'var(--imperial-emerald)' }}>Advanced Filters</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Invoice # or client..."
                style={{ 
                  width: '100%', 
                  padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  background: 'rgba(11, 46, 43, 0.01)'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.625rem 0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(11, 46, 43, 0.1)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--imperial-emerald)',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">All Statuses</option>
              <option value="GENERATED">Generated</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
              Client
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.625rem 0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(11, 46, 43, 0.1)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--imperial-emerald)',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.businessName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
              Date Range
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              />
              <span style={{ color: 'var(--muted-jade)', fontWeight: '700' }}>-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
              Amount Range
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                placeholder="Min"
                style={{ 
                  width: '100%', 
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.8125rem',
                  fontWeight: '500'
                }}
              />
              <span style={{ color: 'var(--muted-jade)', fontWeight: '700' }}>-</span>
              <input
                type="number"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
                placeholder="Max"
                style={{ 
                  width: '100%', 
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.8125rem',
                  fontWeight: '500'
                }}
              />
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={clearFilters}
            style={{ 
              fontSize: '0.8125rem', 
              padding: '0.5rem 1.25rem', 
              background: 'transparent',
              border: '1px solid rgba(11, 46, 43, 0.1)',
              borderRadius: '0.5rem',
              color: 'var(--muted-jade)',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(11, 46, 43, 0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.size > 0 && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem 1.5rem', 
          background: 'var(--imperial-emerald)', 
          borderRadius: '1rem',
          boxShadow: '0 8px 24px rgba(11, 46, 43, 0.15)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '800'
            }}>
              {selectedInvoices.size}
            </div>
            <span style={{ fontWeight: '700', color: 'white', fontSize: '0.9375rem' }}>
              Selected for bulk action
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleBulkMarkPaid}
              disabled={bulkActionLoading}
              style={{ 
                fontSize: '0.8125rem', 
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <CheckCircle size={14} />
              {bulkActionLoading ? 'Processing...' : 'Mark Paid'}
            </button>
            <button
              onClick={handleBulkDownload}
              disabled={bulkActionLoading}
              style={{ 
                fontSize: '0.8125rem', 
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <Download size={14} />
              {bulkActionLoading ? 'Preparing...' : 'Download PDFs'}
            </button>
            <button
              onClick={() => setSelectedInvoices(new Set())}
              style={{ 
                fontSize: '0.8125rem', 
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Invoice Table */}
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
              Accounts Ledger
            </h2>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500', marginTop: '0.25rem' }}>
              {filteredInvoices.length} transactions match current criteria
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                setBulkActionLoading(true);
                const params = new URLSearchParams();
                if (statusFilter) params.set('status', statusFilter);
                if (clientFilter) params.set('clientId', clientFilter);
                if (dateFrom) params.set('dateFrom', dateFrom);
                if (dateTo) params.set('dateTo', dateTo);

                const response = await fetch(`/api/admin/invoices/export/excel?${params.toString()}`);
                if (!response.ok) throw new Error('Export failed');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ledger-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (err: any) {
                setError(err.message || 'Failed to export');
              } finally {
                setBulkActionLoading(false);
              }
            }}
            disabled={bulkActionLoading || filteredInvoices.length === 0}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.625rem',
              border: '1px solid rgba(196, 183, 91, 0.3)',
              background: 'white',
              color: 'var(--imperial-emerald)',
              fontSize: '0.8125rem',
              fontWeight: '750',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              opacity: filteredInvoices.length === 0 ? 0.5 : 1
            }}
            onMouseEnter={(e) => { if (filteredInvoices.length > 0) e.currentTarget.style.background = 'rgba(196, 183, 91, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
          >
            <Download size={14} />
            Export Ledger
          </button>
        </div>

        {filteredInvoices.length === 0 ? (
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
              <FileText size={32} />
            </div>
            <p style={{ color: 'var(--muted-jade)', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '500' }}>
              {invoices.length === 0 ? 'No invoices registered in the system yet.' : 'No invoices match your active filters.'}
            </p>
            {invoices.length > 0 && (
              <button onClick={clearFilters} className="btn-primary">Clear all filters</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                  <th style={{ padding: '1.125rem 1.25rem', textAlign: 'left', width: '40px', borderBottom: '1px solid rgba(196, 183, 91, 0.15)' }}>
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--imperial-emerald)' }}
                    />
                  </th>
                  {['Invoice Details', 'Client', 'Billing Dates', 'Net Amount', 'Payment Status', 'Actions'].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: '1.125rem 1.25rem',
                        textAlign: header === 'Net Amount' ? 'right' : header === 'Actions' ? 'center' : 'left',
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
                {filteredInvoices.map((invoice) => {
                  const clientName = typeof invoice.clientId === 'object' ? invoice.clientId.businessName : 'Unknown';
                  const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(invoice.createdAt);
                  const dueDate = new Date(invoice.dueDate);
                  const paymentDate = invoice.paymentDate ? new Date(invoice.paymentDate) : null;
                  const isOverdue = invoice.status === 'GENERATED' && dueDate < new Date();

                  return (
                    <tr 
                      key={invoice._id}
                      style={{ 
                        borderBottom: '1px solid rgba(196, 183, 91, 0.08)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleSelectInvoice(invoice._id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice._id)}
                          onChange={() => toggleSelectInvoice(invoice._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--imperial-emerald)' }}
                        />
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>
                          {invoice.invoiceNumber || `INV-${invoice._id.substring(0, 8).toUpperCase()}`}
                        </div>
                        {invoice.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.125rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {invoice.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(11, 46, 43, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--imperial-emerald)' }}>
                            <Building2 size={14} />
                          </div>
                          <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{clientName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
                            <Calendar size={12} />
                            {invoiceDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: isOverdue ? '#dc2626' : 'var(--muted-jade)', fontWeight: isOverdue ? '700' : '500' }}>
                            <Clock size={12} />
                            Due {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1rem' }}>
                          {invoice.currency} {invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '2rem',
                            background: invoice.status === 'PAID' ? '#d1fae5' : (isOverdue || invoice.status === 'OVERDUE') ? '#fee2e2' : '#fef3c7',
                            color: invoice.status === 'PAID' ? '#059669' : (isOverdue || invoice.status === 'OVERDUE') ? '#dc2626' : '#d97706',
                            fontWeight: '750',
                            fontSize: '0.75rem',
                            width: 'fit-content'
                          }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                            {isOverdue && invoice.status === 'GENERATED' ? 'OVERDUE' : invoice.status}
                          </span>
                          {paymentDate && (
                            <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: '600', marginLeft: '0.5rem' }}>
                              Paid {paymentDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {invoice.fileId && (
                            <button
                              onClick={() => handleDownloadInvoice(invoice._id, invoice.fileId!)}
                              style={{
                                padding: '0.5rem',
                                border: '1px solid rgba(196, 183, 91, 0.2)',
                                background: 'white',
                                borderRadius: '0.625rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                color: 'var(--imperial-emerald)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(11, 46, 43, 0.03)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                          )}
                          {invoice.status !== 'PAID' && (
                            <button
                              onClick={() => { if (confirm('Mark this invoice as paid?')) handleMarkPaid(invoice._id); }}
                              style={{
                                padding: '0.5rem',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                background: 'white',
                                borderRadius: '0.625rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                color: '#10b981'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              title="Mark as Paid"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

