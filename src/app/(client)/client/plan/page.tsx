'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Mail, Users, ArrowRight, CheckCircle2, Circle } from 'lucide-react';

interface Plan {
  _id?: string;
  name: string;
  description?: string;
  pricePerMonth?: number;
  licensesPerMonth: number;
  numberOfLicenses?: number;
  planType?: 'REGULAR' | 'POC';
  pricePerLicense?: number;
  currency?: 'USD' | 'INR';
  totalCostOfService?: number;
  features?: string[];
}

interface License {
  _id: string;
  productOrServiceName: string;
  serviceType: string;
  label: string;
  status: 'active' | 'paused';
  startDate: string;
  endDate?: string;
}

export default function ClientPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [accountManager, setAccountManager] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [licensesAvailable, setLicensesAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlanData = useCallback(async () => {
    try {
      const [planResponse, dashboardResponse, chartsResponse] = await Promise.all([
        fetch('/api/client/plan'),
        fetch('/api/client/dashboard'),
        fetch('/api/client/dashboard/charts'),
      ]);

      if (!planResponse.ok || !dashboardResponse.ok) {
        if (planResponse.status === 401 || dashboardResponse.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch plan data');
      }

      const planData = await planResponse.json();
      const dashboardData = await dashboardResponse.json();
      
      if (chartsResponse.ok) {
        const chartsData = await chartsResponse.json();
        setChartData(chartsData.charts);
      }

      if (planData.plan) {
        setPlan(planData.plan);
      }
      
      if (dashboardData.accountManager) {
        setAccountManager(dashboardData.accountManager);
      }
      
      const licensesFromPlan = planData.licensesAvailable || 0;
      const licensesFromDashboard = dashboardData.currentMonthStatus?.licensesRemaining || 0;
      const finalLicenses = licensesFromPlan > 0 ? licensesFromPlan : licensesFromDashboard;
      
      setLicensesAvailable(finalLicenses);
    } catch (err: any) {
      setError(err.message || 'Failed to load plan data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchLicenses = useCallback(async () => {
    try {
      const response = await fetch('/api/client/licenses');
      if (response.ok) {
        const data = await response.json();
        setLicenses(data.licenses || []);
      }
    } catch (err) {
      console.error('Failed to fetch licenses:', err);
    }
  }, []);

  useEffect(() => {
    fetchPlanData();
    fetchLicenses();
  }, [fetchPlanData, fetchLicenses]);

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
        Plan & Licenses
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Account Manager Card */}
        {accountManager && (
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(11, 46, 43, 0.05) 0%, rgba(11, 46, 43, 0.02) 100%)',
            border: '2px solid rgba(11, 46, 43, 0.1)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(11, 46, 43, 0.1)', borderRadius: '0.5rem' }}>
                  <Users size={20} color="var(--imperial-emerald)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
                  Account Manager
                </h3>
              </div>
              <p style={{ color: 'var(--imperial-emerald)', marginBottom: '0.25rem', fontSize: '1.125rem', fontWeight: '600' }}>
                {accountManager.name}
              </p>
              <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {accountManager.email}
              </p>
            </div>
            <a 
              href={`mailto:${accountManager.email}`}
              className="btn-primary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                textDecoration: 'none',
                justifyContent: 'center',
                padding: '0.75rem'
              }}
            >
              <Mail size={18} />
              Contact Support
            </a>
          </div>
        )}

        {/* Current Plan Section */}
        {plan && (
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(196, 183, 91, 0.1) 0%, rgba(196, 183, 91, 0.05) 100%)',
            border: '2px solid rgba(196, 183, 91, 0.2)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--imperial-emerald)', fontWeight: '600', borderBottom: '1px solid rgba(196, 183, 91, 0.2)', paddingBottom: '0.5rem' }}>
              Current Subscription
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'var(--imperial-emerald)', marginBottom: '0.25rem', fontSize: '1.25rem', fontWeight: '700' }}>
                  {plan.name}
                </p>
                {plan.planType && (
                  <span style={{ 
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    background: 'var(--golden-opal)',
                    color: 'white',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem'
                  }}>
                    {plan.planType} Plan
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--imperial-emerald)', fontWeight: '700', fontSize: '1.25rem' }}>
                  {plan.currency || 'USD'} {plan.totalCostOfService?.toFixed(2) || '0.00'}
                </p>
                <p style={{ color: 'var(--muted-jade)', fontSize: '0.75rem' }}>Total Cost</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '0.75rem' }}>
              <div>
                <p style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allocation</p>
                <p style={{ color: 'var(--imperial-emerald)', fontWeight: '600' }}>{plan.numberOfLicenses || plan.licensesPerMonth} Licenses</p>
              </div>
              <div>
                <p style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price/Unit</p>
                <p style={{ color: 'var(--imperial-emerald)', fontWeight: '600' }}>{plan.currency || 'USD'} {plan.pricePerLicense?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Services Table */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '2px solid rgba(196, 183, 91, 0.3)',
          background: 'linear-gradient(135deg, rgba(196, 183, 91, 0.1) 0%, rgba(196, 183, 91, 0.05) 100%)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
            Active Services & Licenses ({licenses.length})
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                background: 'rgba(11, 46, 43, 0.05)',
                borderBottom: '2px solid rgba(196, 183, 91, 0.3)'
              }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Name</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-jade)' }}>
                    No active licenses found.
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr 
                    key={license._id} 
                    style={{ 
                      borderBottom: '1px solid rgba(196, 183, 91, 0.15)',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196, 183, 91, 0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
                      {license.productOrServiceName || license.label}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted-jade)' }}>{license.serviceType}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted-jade)' }}>{new Date(license.startDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted-jade)' }}>{license.endDate ? new Date(license.endDate).toLocaleDateString() : 'Active'}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '0.375rem', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: license.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                        color: license.status === 'active' ? '#10b981' : '#6b7280',
                        textTransform: 'uppercase'
                      }}>
                        {license.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* License Usage Chart */}
        {chartData?.licenseUsage && chartData.licenseUsage.length > 0 && (
          <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--imperial-emerald)' }}>
              License Usage Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.licenseUsage}>
                <defs>
                  <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(196, 183, 91, 0.2)" />
                <XAxis dataKey="month" stroke="var(--muted-jade)" fontSize={12} />
                <YAxis stroke="var(--muted-jade)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid rgba(196, 183, 91, 0.3)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="used" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsed)" name="Used Licenses" />
                <Area type="monotone" dataKey="available" stroke="var(--golden-opal)" fill="transparent" name="Available Capacity" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* License Utilization Stats */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--imperial-emerald)' }}>
            Allocation Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(196, 183, 91, 0.1)', borderRadius: '0.75rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Allocated</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--imperial-emerald)' }}>{licensesAvailable}</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Currently Active</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{licenses.filter(l => l.status === 'active').length}</p>
            </div>
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--imperial-emerald)', fontWeight: '600' }}>Utilization Rate</span>
              <span style={{ color: 'var(--muted-jade)' }}>
                {licensesAvailable > 0 ? Math.round((licenses.filter(l => l.status === 'active').length / licensesAvailable) * 100) : 0}%
              </span>
            </div>
            <div style={{ width: '100%', height: '12px', background: 'rgba(196, 183, 91, 0.2)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${licensesAvailable > 0 ? Math.min((licenses.filter(l => l.status === 'active').length / licensesAvailable) * 100, 100) : 0}%`, 
                height: '100%', 
                background: 'var(--golden-opal)',
                borderRadius: '6px',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--muted-jade)', fontSize: '0.875rem', textAlign: 'center' }}>
              {Math.max(0, licensesAvailable - licenses.filter(l => l.status === 'active').length)} unused licenses available for assignment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
