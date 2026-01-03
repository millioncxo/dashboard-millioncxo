'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { Edit, UserX, Users, Briefcase, CheckCircle2, AlertCircle, X, Search, Filter, Plus, UserPlus, ShieldCheck, Mail, Building2, Calendar } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Client {
  _id: string;
  businessName: string;
}

interface License {
  _id: string;
  label: string;
  serviceType: string;
  status: string;
  clientId: string;
}

interface Assignment {
  _id: string;
  sdrId: { _id: string; name: string; email: string };
  clientId: { _id: string; businessName: string };
  licenses: Array<{ _id: string; label: string; serviceType: string }>;
  createdAt: string;
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

export default function AssignmentsPage() {
  const router = useRouter();
  const [sdrUsers, setSdrUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [sdrFilter, setSdrFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState({
    sdrId: '',
    clientId: '',
    licenseIds: [] as string[],
  });

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch SDR users
      const sdrResponse = await fetch('/api/admin/users?role=SDR');
      if (sdrResponse.ok) {
        const sdrData = await sdrResponse.json();
        setSdrUsers(sdrData.users || []);
      }

      // Fetch clients
      const clientsResponse = await fetch('/api/admin/clients');
      if (!clientsResponse.ok) {
        if (clientsResponse.status === 401 || clientsResponse.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch clients');
      }

      const clientsData = await clientsResponse.json();
      setClients(clientsData.clients || []);

      // Build assignments list from clients data
      const assignmentsList: Assignment[] = [];
      clientsData.clients.forEach((client: any) => {
        if (client.sdrAssignments && client.sdrAssignments.length > 0) {
          client.sdrAssignments.forEach((assignment: any) => {
            assignmentsList.push({
              _id: assignment._id || assignment.sdrId?._id + client._id,
              sdrId: assignment.sdrId,
              clientId: { _id: client._id, businessName: client.businessName },
              licenses: assignment.licenses || [],
              createdAt: assignment.createdAt || new Date().toISOString(),
            });
          });
        }
      });
      setAssignments(assignmentsList);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchLicensesForClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/admin/licenses?clientId=${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch licenses');
      }
      const data = await response.json();
      setLicenses(data.licenses || []);
    } catch (err: any) {
      console.error('Failed to fetch licenses:', err);
      setLicenses([]);
    }
  };

  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const uniqueSDRs = new Set(assignments.map(a => a.sdrId._id)).size;
    const uniqueClients = new Set(assignments.map(a => a.clientId._id)).size;
    const totalLicenses = assignments.reduce((acc, a) => acc + a.licenses.length, 0);

    return [
      { label: 'Active Assignments', value: totalAssignments, icon: ShieldCheck, color: 'var(--imperial-emerald)' },
      { label: 'Deployed SDRs', value: uniqueSDRs, icon: Users, color: '#10b981' },
      { label: 'Serviced Clients', value: uniqueClients, icon: Building2, color: 'var(--golden-opal)' },
      { label: 'Managed Licenses', value: totalLicenses, icon: Briefcase, color: 'var(--muted-jade)' },
    ];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesSearch = assignment.sdrId.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          assignment.sdrId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assignment.clientId.businessName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSdr = !sdrFilter || assignment.sdrId._id === sdrFilter;
      const matchesClient = !clientFilter || assignment.clientId._id === clientFilter;
      return matchesSearch && matchesSdr && matchesClient;
    });
  }, [assignments, searchTerm, sdrFilter, clientFilter]);

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, clientId, licenseIds: [] });
    if (clientId) {
      fetchLicensesForClient(clientId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sdrId || !formData.clientId) {
      showNotification('SDR and Client are required', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/assign-sdr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdrId: formData.sdrId,
          clientId: formData.clientId,
          licenseIds: formData.licenseIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign SDR');
      }

      await fetchData();
      setShowForm(false);
      setFormData({
        sdrId: '',
        clientId: '',
        licenseIds: [],
      });
      showNotification(`SDR successfully assigned to client`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to assign SDR', 'error');
    }
  };

  const handleUnassign = async (assignment: Assignment) => {
    if (!confirm(`Are you sure you want to unassign ${assignment.sdrId.name} from ${assignment.clientId.businessName}? This action will be logged.`)) {
      return;
    }
    try {
      const response = await fetch('/api/admin/assign-sdr', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment._id,
          sdrId: assignment.sdrId._id,
          clientId: assignment.clientId._id,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unassign SDR');
      }
      await fetchData();
      showNotification('SDR unassigned successfully. Action has been logged.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to unassign SDR', 'error');
    }
  };

  if (loading && assignments.length === 0) {
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
            Workforce Allocation
          </h1>
          <p style={{ color: 'var(--muted-jade)', fontSize: '0.9375rem', fontWeight: '500', marginTop: '0.25rem' }}>
            Strategically deploy SDRs across client accounts and licenses
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAssignment(null);
            setFormData({
              sdrId: '',
              clientId: '',
              licenseIds: [],
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
          <UserPlus size={18} />
          Create Allocation
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
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 2, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
          <input
            type="text"
            placeholder="Search by SDR name or client business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(11, 46, 43, 0.1)',
              fontSize: '0.875rem',
              fontWeight: '500',
              background: 'rgba(11, 46, 43, 0.01)',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={sdrFilter}
            onChange={(e) => setSdrFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(11, 46, 43, 0.1)',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--imperial-emerald)',
              background: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">Filter by SDR</option>
            {sdrUsers.map((sdr) => (
              <option key={sdr._id} value={sdr._id}>{sdr.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(11, 46, 43, 0.1)',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--imperial-emerald)',
              background: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">Filter by Client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>{client.businessName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: '1.5rem', 
        border: '1px solid rgba(196, 183, 91, 0.15)',
        boxShadow: '0 10px 30px rgba(11, 46, 43, 0.04)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(196, 183, 91, 0.1)', background: 'linear-gradient(to right, rgba(196, 183, 91, 0.05), transparent)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '750', margin: 0 }}>Allocation Matrix</h2>
          <p style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500', marginTop: '0.25rem' }}>
            Current operational mapping between talent and client assets
          </p>
        </div>

        {filteredAssignments.length === 0 ? (
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
              <ShieldCheck size={40} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--imperial-emerald)', fontWeight: '750', marginBottom: '0.5rem' }}>No allocations found</h3>
            <p style={{ color: 'var(--muted-jade)', maxWidth: '400px', margin: '0 auto' }}>
              No active assignments match your current filter selection. Adjust parameters or create a new allocation.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SDR Professional</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Account</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allocated Licenses</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Effective Since</th>
                  <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: '700', color: 'var(--muted-jade)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr 
                    key={assignment._id}
                    style={{ 
                      borderBottom: '1px solid rgba(196, 183, 91, 0.08)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--imperial-emerald)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem' }}>
                          {assignment.sdrId.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>{assignment.sdrId.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.125rem' }}>
                            <Mail size={12} /> {assignment.sdrId.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Building2 size={16} color="var(--imperial-emerald)" />
                        <div style={{ fontWeight: '700', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>{assignment.clientId.businessName}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {assignment.licenses.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              background: 'var(--imperial-emerald)', 
                              borderRadius: '2rem',
                              color: 'white', 
                              fontSize: '0.8125rem', 
                              fontWeight: '800'
                            }}>
                              {assignment.licenses.length}
                            </span>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--muted-jade)', fontWeight: '600' }}>
                              {assignment.licenses.length === 1 ? 'License' : 'Licenses'} Allocated
                            </span>
                          </div>
                        ) : (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--golden-opal)', 
                            fontWeight: '750',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            background: 'rgba(196, 183, 91, 0.1)',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '0.5rem'
                          }}>
                            Universal Access (All)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
                        <Calendar size={14} />
                        {new Date(assignment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingAssignment(assignment);
                            setFormData({
                              sdrId: assignment.sdrId._id,
                              clientId: assignment.clientId._id,
                              licenseIds: assignment.licenses.map(l => l._id),
                            });
                            setShowForm(true);
                            if (assignment.clientId._id) fetchLicensesForClient(assignment.clientId._id);
                          }}
                          style={{
                            width: '36px', height: '36px', border: '1px solid rgba(11, 46, 43, 0.1)', background: 'white',
                            borderRadius: '0.625rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease', color: 'var(--imperial-emerald)'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--imperial-emerald)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--imperial-emerald)'; }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleUnassign(assignment)}
                          style={{
                            width: '36px', height: '36px', border: '1px solid rgba(239, 68, 68, 0.1)', background: 'white',
                            borderRadius: '0.625rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease', color: '#ef4444'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                        >
                          <UserX size={16} />
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

      {/* Allocation Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 46, 43, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '2rem'
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '640px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.75rem 2rem', background: 'linear-gradient(135deg, var(--imperial-emerald) 0%, #064e3b 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{editingAssignment ? 'Edit Workforce Allocation' : 'Establish New Allocation'}</h2>
                <p style={{ fontSize: '0.8125rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>Map talent to specific client infrastructure</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '750', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Professional Representative (SDR) *</label>
                  <select
                    value={formData.sdrId}
                    onChange={(e) => setFormData({ ...formData, sdrId: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                      fontSize: '0.9375rem', fontWeight: '600', color: 'var(--imperial-emerald)', background: 'white'
                    }}
                  >
                    <option value="">Select SDR...</option>
                    {sdrUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: '750', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Target Client Organization *</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                      fontSize: '0.9375rem', fontWeight: '600', color: 'var(--imperial-emerald)', background: 'white'
                    }}
                  >
                    <option value="">Select Client Organization...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.businessName}</option>)}
                  </select>
                </div>
              </div>

              {formData.clientId && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8125rem', fontWeight: '750', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Scope of Assignment (Licenses)</label>
                  {licenses.length > 0 ? (
                    <div style={{ 
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1.25rem',
                      background: 'rgba(11, 46, 43, 0.02)', borderRadius: '1rem', border: '1px solid rgba(11, 46, 43, 0.05)',
                      maxHeight: '320px', overflowY: 'auto'
                    }}>
                      {licenses.map(l => (
                        <label key={l._id} style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem',
                          borderRadius: '0.5rem', transition: 'all 0.2s ease'
                        }}>
                          <input
                            type="checkbox"
                            checked={formData.licenseIds.includes(l._id)}
                            onChange={(e) => {
                              const ids = e.target.checked 
                                ? [...formData.licenseIds, l._id] 
                                : formData.licenseIds.filter(id => id !== l._id);
                              setFormData({ ...formData, licenseIds: ids });
                            }}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--imperial-emerald)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--imperial-emerald)' }}>{l.label}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted-jade)', fontWeight: '600' }}>{l.serviceType}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', background: 'rgba(196, 183, 91, 0.05)', borderRadius: '1rem', border: '1px dashed rgba(196, 183, 91, 0.3)', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-jade)', fontWeight: '500' }}>No active licenses found for this client.</p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{
                  flex: 1, padding: '1rem', borderRadius: '0.75rem', border: 'none',
                  background: 'var(--imperial-emerald)', color: 'white', fontWeight: '800', fontSize: '0.9375rem',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(11, 46, 43, 0.15)'
                }}>
                  {editingAssignment ? 'Update Allocation Matrix' : 'Establish Operational Allocation'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(11, 46, 43, 0.1)',
                  background: 'transparent', color: 'var(--muted-jade)', fontWeight: '750', fontSize: '0.9375rem',
                  cursor: 'pointer'
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

