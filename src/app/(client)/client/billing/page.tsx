'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, DollarSign, FileText, Eye, Download } from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  status: 'GENERATED' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paidAt?: string;
  description?: string;
  createdAt: string;
  invoiceDate?: string;
  paymentDate?: string;
  amountPaid?: number;
  currency?: string;
  fileId?: string | null; // GridFS file ID
}

interface BillingData {
  upcoming: Invoice[];
  overdue: Invoice[];
  history: Invoice[];
}

export default function ClientBillingPage() {
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingData>({ upcoming: [], overdue: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBillingData = useCallback(async () => {
    try {
      const response = await fetch('/api/client/billing');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch billing data');
      }
      const data = await response.json();
      setBillingData(data.billing || { upcoming: [], overdue: [], history: [] });
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#10b981';
      case 'OVERDUE':
        return '#dc2626';
      case 'GENERATED':
        return '#f59e0b';
      default:
        return 'var(--muted-jade)';
    }
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

  const totalUpcoming = billingData.upcoming.reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = billingData.overdue.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.push('/client')}
          className="btn-secondary"
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Back to Dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--imperial-emerald)' }}>
          Billing & Invoices
        </h1>
      </div>

      {/* Billing Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(196, 183, 91, 0.1)', borderRadius: '0.5rem' }}>
              <DollarSign size={20} color="var(--golden-opal)" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
              Upcoming Payments
            </h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--imperial-emerald)', marginBottom: '0.5rem' }}>
            {formatCurrency(totalUpcoming)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={14} />
            {billingData.upcoming.length} pending invoice{billingData.upcoming.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="card" style={{ 
          padding: '1.25rem 1.5rem', 
          background: totalOverdue > 0 ? 'rgba(220, 38, 38, 0.02)' : 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          borderLeft: totalOverdue > 0 ? '4px solid #dc2626' : '1px solid transparent'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: totalOverdue > 0 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem' }}>
              <FileText size={20} color={totalOverdue > 0 ? '#dc2626' : '#10b981'} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
              Payment Status
            </h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: totalOverdue > 0 ? '#dc2626' : '#10b981', marginBottom: '0.5rem' }}>
            {totalOverdue > 0 ? formatCurrency(totalOverdue) : 'Healthy'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
            {totalOverdue > 0 
              ? `${billingData.overdue.length} invoice${billingData.overdue.length !== 1 ? 's' : ''} overdue`
              : 'All payments are up to date'}
          </div>
        </div>
      </div>

      {/* Overdue Invoices Section */}
      {billingData.overdue.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: '#dc2626', fontWeight: '600', borderBottom: '1px solid rgba(220, 38, 38, 0.2)', paddingBottom: '0.75rem' }}>
            Overdue Invoices
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {billingData.overdue.map((invoice) => (
              <div
                key={invoice._id}
                style={{
                  padding: '1.25rem',
                  background: 'rgba(220, 38, 38, 0.03)',
                  border: '1px solid rgba(220, 38, 38, 0.1)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--imperial-emerald)' }}>
                    Invoice #{invoice.invoiceNumber}
                  </h3>
                  <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{invoice.description || 'Service Fee'}</p>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#dc2626' }}><strong>Due:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    <span style={{ color: '#dc2626', fontWeight: '600' }}>{Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)))} days overdue</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>{formatCurrency(invoice.amount)}</div>
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

      {/* Upcoming Invoices Table */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'linear-gradient(135deg, rgba(196, 183, 91, 0.1) 0%, rgba(196, 183, 91, 0.05) 100%)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
            Upcoming Invoices
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(11, 46, 43, 0.05)', borderBottom: '2px solid rgba(196, 183, 91, 0.3)' }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Invoice #</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Due Date</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {billingData.upcoming.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-jade)' }}>No upcoming invoices.</td>
                </tr>
              ) : (
                billingData.upcoming.map((invoice) => (
                  <tr key={invoice._id} style={{ borderBottom: '1px solid rgba(196, 183, 91, 0.15)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>#{invoice.invoiceNumber}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted-jade)' }}>{invoice.description || 'Monthly Fee'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted-jade)' }}>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '700', color: 'var(--imperial-emerald)' }}>{formatCurrency(invoice.amount)}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      {invoice.fileId && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="card" style={{ padding: '0', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'rgba(11, 46, 43, 0.03)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
            Payment History
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(11, 46, 43, 0.05)', borderBottom: '2px solid rgba(196, 183, 91, 0.3)' }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Invoice #</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Paid Date</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {billingData.history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-jade)' }}>No payment history available.</td>
                </tr>
              ) : (
                billingData.history.map((invoice) => (
                  <tr key={invoice._id} style={{ borderBottom: '1px solid rgba(196, 183, 91, 0.15)' }}>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted-jade)' }}>#{invoice.invoiceNumber}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted-jade)' }}>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '600', color: 'var(--imperial-emerald)' }}>{formatCurrency(invoice.amount)}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '0.375rem', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        textTransform: 'uppercase'
                      }}>PAID</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      {invoice.fileId && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
