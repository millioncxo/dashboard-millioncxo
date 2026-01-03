'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { Edit, Power, Users, DollarSign, Briefcase, CheckCircle2, AlertCircle, X, Search, Filter, Plus } from 'lucide-react';

interface Plan {
  _id: string;
  name: string;
  description?: string;
  pricePerMonth?: number;
  isActive?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PlanUsage {
  planId: string;
  clientCount: number;
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

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planUsage, setPlanUsage] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerMonth: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/plans');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch plans');
      }
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPlanUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/plans/usage');
      if (response.ok) {
        const data = await response.json();
        const usageMap = new Map<string, number>();
        data.usage.forEach((item: PlanUsage) => {
          usageMap.set(item.planId, item.clientCount);
        });
        setPlanUsage(usageMap);
      }
    } catch (err) {
      console.error('Failed to fetch plan usage:', err);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchPlanUsage();
  }, [fetchPlans, fetchPlanUsage]);

  const stats = useMemo(() => {
    const active = plans.filter(p => p.isActive !== false).length;
    const inactive = plans.length - active;
    const avgPrice = plans.length > 0 
      ? plans.reduce((acc, p) => acc + (p.pricePerMonth || 0), 0) / plans.length 
      : 0;
    const totalClients = Array.from(planUsage.values()).reduce((acc, count) => acc + count, 0);

    return [
      { label: 'Total Service Plans', value: plans.length, icon: Briefcase, color: 'var(--imperial-emerald)' },
      { label: 'Active Plans', value: active, icon: CheckCircle2, color: '#10b981' },
      { label: 'Avg. Plan Price', value: `$${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'var(--golden-opal)' },
      { label: 'Total Subscriptions', value: totalClients, icon: Users, color: 'var(--muted-jade)' },
    ];
  }, [plans, planUsage]);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (plan.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || 
                           (statusFilter === 'ACTIVE' && plan.isActive !== false) ||
                           (statusFilter === 'INACTIVE' && plan.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan._id}` : '/api/admin/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const payload: any = {
        name: formData.name,
        description: formData.description,
      };
      
      if (formData.pricePerMonth) {
        payload.pricePerMonth = parseFloat(formData.pricePerMonth);
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${editingPlan ? 'update' : 'create'} plan`);
      }

      setShowForm(false);
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        pricePerMonth: '',
      });
      showNotification(`Plan ${editingPlan ? 'updated' : 'created'} successfully!`, 'success');
      await fetchPlans();
      await fetchPlanUsage();
    } catch (err: any) {
      showNotification(err.message || `Failed to ${editingPlan ? 'update' : 'create'} plan`, 'error');
    }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this plan?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} plan`);
      }

      showNotification(`Plan ${action}d successfully!`, 'success');
      await fetchPlans();
      await fetchPlanUsage();
    } catch (err: any) {
      showNotification(err.message || `Failed to ${action} plan`, 'error');
    }
  };

  if (loading && plans.length === 0) {
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
            Service Catalog
          </h1>
          <p style={{ color: 'var(--muted-jade)', fontSize: '0.9375rem', fontWeight: '500', marginTop: '0.25rem' }}>
            Architect and manage service offerings and pricing tiers
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setFormData({
              name: '',
              description: '',
              pricePerMonth: '',
            });
            setShowForm(true);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--imperial-emerald)',
            color: 'white',
            borderRadius: '0.75rem',
            border: 'none',
            fontWeight: '750',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(11, 46, 43, 0.15)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} />
          Create New Plan
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

      {/* Filters & Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: '1.5rem', 
        border: '1px solid rgba(196, 183, 91, 0.15)',
        boxShadow: '0 10px 30px rgba(11, 46, 43, 0.04)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1.5rem 2rem', 
          borderBottom: '1px solid rgba(196, 183, 91, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
              <input
                type="text"
                placeholder="Search plan name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(11, 46, 43, 0.1)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  background: 'rgba(11, 46, 43, 0.01)',
                  outline: 'none'
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                border: '1px solid rgba(11, 46, 43, 0.1)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--imperial-emerald)',
                background: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '600' }}>
            {filteredPlans.length} plans available
          </div>
        </div>

        {filteredPlans.length === 0 ? (
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
              <Briefcase size={40} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '750', marginBottom: '0.5rem' }}>No plans found</h3>
            <p style={{ color: 'var(--muted-jade)', maxWidth: '400px', margin: '0 auto' }}>
              We couldn&#39;t find any plans matching your search criteria. Try adjusting your filters or create a new plan.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Details</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Rate</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilization</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr 
                    key={plan._id}
                    style={{ 
                      borderBottom: '1px solid rgba(196, 183, 91, 0.08)',
                      transition: 'all 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1rem', marginBottom: '0.25rem' }}>
                        {plan.name}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted-jade)', maxWidth: '400px', lineHeight: '1.4' }}>
                        {plan.description || 'No description available for this tier.'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '1.125rem' }}>
                        {plan.pricePerMonth ? `$${plan.pricePerMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '600', textTransform: 'uppercase' }}>per month</div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '1rem' }}>
                          <Users size={16} />
                          {planUsage.get(plan._id) || 0}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '600', textTransform: 'uppercase' }}>clients</div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.875rem',
                        borderRadius: '2rem',
                        background: (plan.isActive !== false) ? '#d1fae5' : '#fee2e2',
                        color: (plan.isActive !== false) ? '#059669' : '#dc2626',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                        {(plan.isActive !== false) ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingPlan(plan);
                            setFormData({
                              name: plan.name,
                              description: plan.description || '',
                              pricePerMonth: plan.pricePerMonth?.toString() || '',
                            });
                            setShowForm(true);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '1px solid rgba(11, 46, 43, 0.1)',
                            background: 'white',
                            borderRadius: '0.625rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            color: 'var(--imperial-emerald)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--imperial-emerald)';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = 'var(--imperial-emerald)';
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(plan._id, plan.isActive !== false)}
                          disabled={(planUsage.get(plan._id) ?? 0) > 0 && plan.isActive !== false}
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '1px solid rgba(11, 46, 43, 0.1)',
                            background: 'white',
                            borderRadius: '0.625rem',
                            cursor: (planUsage.get(plan._id) ?? 0) > 0 && plan.isActive !== false ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            color: (plan.isActive !== false) ? '#ef4444' : '#10b981',
                            opacity: (planUsage.get(plan._id) ?? 0) > 0 && plan.isActive !== false ? 0.3 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!((planUsage.get(plan._id) ?? 0) > 0 && plan.isActive !== false)) {
                              e.currentTarget.style.background = (plan.isActive !== false) ? '#fee2e2' : '#d1fae5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                          }}
                          title={(planUsage.get(plan._id) ?? 0) > 0 && plan.isActive !== false ? 'Cannot archive plan with active subscriptions' : ''}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 46, 43, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '2rem'
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.75rem 2rem',
              background: 'linear-gradient(135deg, var(--imperial-emerald) 0%, #064e3b 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                  {editingPlan ? 'Refine Service Tier' : 'New Service Tier'}
                </h2>
                <p style={{ fontSize: '0.8125rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>
                  Define parameters for this specific service level
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '750', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                    Plan Nomenclature *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Enterprise Elite Plus"
                    style={{
                      width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                      fontSize: '0.9375rem', fontWeight: '600', color: 'var(--imperial-emerald)', background: 'rgba(11, 46, 43, 0.01)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '750', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                    Value Proposition / Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Briefly describe the unique value of this service tier..."
                    style={{
                      width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                      fontSize: '0.9375rem', fontWeight: '500', color: 'var(--imperial-emerald)', background: 'rgba(11, 46, 43, 0.01)',
                      resize: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '750', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                    Subscription Premium (USD)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
                    <input
                      type="number"
                      value={formData.pricePerMonth}
                      onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{
                        width: '100%', padding: '0.875rem 1rem 0.875rem 2.5rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                        fontSize: '0.9375rem', fontWeight: '750', color: 'var(--imperial-emerald)', background: 'rgba(11, 46, 43, 0.01)'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{
                  flex: 1, padding: '0.875rem', borderRadius: '0.75rem', border: 'none',
                  background: 'var(--imperial-emerald)', color: 'white', fontWeight: '800', fontSize: '0.9375rem',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(11, 46, 43, 0.15)'
                }}>
                  {editingPlan ? 'Update Global Catalog' : 'Publish to Catalog'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '0.875rem 1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                  background: 'transparent', color: 'var(--muted-jade)', fontWeight: '750', fontSize: '0.9375rem',
                  cursor: 'pointer'
                }}>
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

