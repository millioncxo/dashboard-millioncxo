'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { 
  Edit, MoreVertical, Trash2, Eye, EyeOff, Search, 
  Filter, Plus, User, Mail, ShieldCheck, CheckCircle2, 
  Clock, AlertCircle, X, Key, UserCheck, UserMinus, Activity,
  ChevronRight
} from 'lucide-react';
import { validateEmail } from '@/lib/email-validation';
import NotificationContainer, { useNotifications } from '@/components/Notification';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SDR';
  isActive: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SDR' as 'ADMIN' | 'SDR',
    isActive: true,
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const { notifications, showNotification, dismissNotification } = useNotifications();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
      } else {
        const data = await response.json();
        const usersList = data.users || [];
        setUsers(usersList);
        setFilteredUsers(usersList);
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset password-related state when modal opens/closes or user changes
  useEffect(() => {
    if (!showDetails || !selectedUser) {
      setCurrentPassword(null);
      setShowCurrentPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    }
  }, [showDetails, selectedUser]);

  // Apply filters when roleFilter, statusFilter, or searchTerm changes
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter) {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => user.isActive === false);
      }
    }

    setFilteredUsers(filtered);
  }, [roleFilter, statusFilter, searchTerm, users]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError(null);

    // Validate email before submission
    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setError(emailValidationError);
      return;
    }

    try {
      const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };
      
      // Only include password if it's provided (for updates) or required (for new users)
      if (!editingUser) {
        if (!formData.password) {
          throw new Error('Password is required for new users');
        }
        payload.password = formData.password;
      } else if (formData.password) {
        // Only update password if provided
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'SDR',
        isActive: true,
      });
      setError('');
      alert(`User ${editingUser ? 'updated' : 'created'} successfully!`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
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
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
      
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
              Team Intelligence
            </h1>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>
              Manage administrative access and SDR workspace assignments
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(11, 46, 43, 0.15)'
            }}
          >
            <Plus size={18} />
            Add Team Member
          </button>
        )}
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

      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
            overflow: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditingUser(null);
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'SDR',
                isActive: true,
              });
            }
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--imperial-emerald)' }}>
                {editingUser ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'SDR',
                    isActive: true,
                  });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--muted-jade)',
                  padding: '0.25rem 0.5rem',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--imperial-emerald)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--muted-jade)';
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    const email = e.target.value;
                    setFormData({ ...formData, email });
                    // Real-time validation
                    const validationError = validateEmail(email);
                    setEmailError(validationError);
                  }}
                  onBlur={(e) => {
                    // Validate on blur as well
                    const validationError = validateEmail(e.target.value);
                    setEmailError(validationError);
                  }}
                  className="input"
                  required
                  placeholder="john@example.com"
                />
                {emailError && (
                  <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                    {emailError}
                  </p>
                )}
                {!emailError && formData.email && (
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                    ✓ Valid email format
                </p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  required={!editingUser}
                  minLength={6}
                  placeholder={editingUser ? "Leave blank to keep current password" : "Minimum 6 characters"}
                />
                {editingUser && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                    Leave blank to keep current password
                  </p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SDR">SDR (Sales Development Representative)</option>
                </select>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                  Note: Client account users are created from the Clients page
                </p>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update Team Member' : 'Add Team Member'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      role: 'SDR',
                      isActive: true,
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <>
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
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)' }} />
              <input
                type="text"
                placeholder="Search team members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
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
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SDR">SDR</option>
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <Activity size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-jade)', pointerEvents: 'none' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            borderRadius: '1.25rem', 
            border: '1px solid rgba(196, 183, 91, 0.15)',
            boxShadow: '0 4px 24px rgba(11, 46, 43, 0.04)',
            overflow: 'hidden'
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
                  Active Team
                </h2>
                <p style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500', marginTop: '0.25rem' }}>
                  {filteredUsers.length} team members registered in the system
                </p>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
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
                  <User size={32} />
                </div>
                <p style={{ color: 'var(--muted-jade)', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '500' }}>
                  No team members found matching your filters.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('');
                    setStatusFilter('');
                  }}
                  className="btn-primary" 
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                      {['Full Name', 'Email Address', 'Platform Role', 'Account Status', 'Actions'].map((header) => (
                        <th
                          key={header}
                          style={{
                            padding: '1.125rem 1.25rem',
                            textAlign: header === 'Actions' ? 'center' : 'left',
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
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user._id}
                        style={{ 
                          borderBottom: '1px solid rgba(196, 183, 91, 0.08)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetails(true);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              background: 'var(--imperial-emerald)', 
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '700'
                            }}>
                              {user.name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-jade)', fontWeight: '500', fontSize: '0.875rem' }}>
                            <Mail size={14} />
                            {user.email}
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '2rem',
                            background: user.role === 'ADMIN' ? 'rgba(11, 46, 43, 0.05)' : 'rgba(196, 183, 91, 0.1)',
                            color: 'var(--imperial-emerald)',
                            fontWeight: '750',
                            fontSize: '0.75rem'
                          }}>
                            {user.role === 'ADMIN' ? <ShieldCheck size={12} /> : <User size={12} />}
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '2rem',
                            background: user.isActive ? '#d1fae5' : '#fee2e2',
                            color: user.isActive ? '#059669' : '#dc2626',
                            fontWeight: '750',
                            fontSize: '0.75rem'
                          }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetails(true);
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
                              gap: '0.5rem',
                              margin: '0 auto'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(11, 46, 43, 0.03)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
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
          </div>
        </>
      )}

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
            overflow: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetails(false);
              setSelectedUser(null);
              setNewPassword('');
              setConfirmPassword('');
            }
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--imperial-emerald)' }}>
                Team Member Details
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--muted-jade)',
                  padding: '0.25rem 0.5rem',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--imperial-emerald)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--muted-jade)';
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* User Information */}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                  User Information
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
                      Name
                    </label>
                    <div style={{ padding: '0.75rem', background: 'rgba(11, 46, 43, 0.05)', borderRadius: '0.375rem', color: 'var(--imperial-emerald)', fontWeight: '500' }}>
                      {selectedUser.name}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
                      Email
                    </label>
                    <div style={{ padding: '0.75rem', background: 'rgba(11, 46, 43, 0.05)', borderRadius: '0.375rem', color: 'var(--imperial-emerald)' }}>
                      {selectedUser.email}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
                      Role
                    </label>
                    <div style={{ padding: '0.75rem', background: 'rgba(11, 46, 43, 0.05)', borderRadius: '0.375rem' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        background: selectedUser.role === 'ADMIN' ? 'rgba(11, 46, 43, 0.1)' : 'rgba(196, 183, 91, 0.2)',
                        color: 'var(--imperial-emerald)',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase'
                      }}>
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
                      Status
                    </label>
                    <div style={{ padding: '0.75rem', background: 'rgba(11, 46, 43, 0.05)', borderRadius: '0.375rem' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        background: selectedUser.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                        color: selectedUser.isActive ? '#10b981' : '#dc2626',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Management */}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
                  Password Management
                </h3>
                <div style={{ 
                  padding: '1rem', 
                  background: 'rgba(11, 46, 43, 0.05)', 
                  borderRadius: '0.375rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(196, 183, 91, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
                      ℹ️ About Passwords
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', lineHeight: '1.5', margin: 0 }}>
                    <strong>Passwords are encrypted and can be viewed by admins.</strong> Click &quot;View Current Password&quot; below to see the user&apos;s password.
                    <br /><br />
                    <strong style={{ color: 'var(--imperial-emerald)' }}>To help a user who forgot their password:</strong>
                    <br />1. Click &quot;View Current Password&quot; to see their existing password
                    <br />2. Or click &quot;🔄 Reset Password (Generate New)&quot; to create a new one
                    <br />3. Share the password with the user
                  </p>
                </div>
                
                {/* View Current Password Section */}
                <div style={{ 
                  padding: '1rem', 
                  background: 'rgba(11, 46, 43, 0.05)', 
                  borderRadius: '0.375rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(196, 183, 91, 0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', fontSize: '0.875rem' }}>
                      Current Password
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedUser) return;
                        setLoadingPassword(true);
                        try {
                          const response = await fetch(`/api/admin/users/${selectedUser._id}/password`);
                          if (!response.ok) {
                            const data = await response.json();
                            showNotification(data.message || data.error || 'Failed to fetch password', 'error');
                            setCurrentPassword(null);
                          } else {
                            const data = await response.json();
                            setCurrentPassword(data.password);
                            setShowCurrentPassword(true);
                            // Auto-copy to clipboard
                            try {
                              await navigator.clipboard.writeText(data.password);
                              showNotification('Password fetched and copied to clipboard!', 'success');
                            } catch (err) {
                              showNotification('Password fetched successfully!', 'success');
                            }
                          }
                        } catch (err: any) {
                          showNotification('Failed to fetch password: ' + (err.message || 'Unknown error'), 'error');
                          setCurrentPassword(null);
                        } finally {
                          setLoadingPassword(false);
                        }
                      }}
                      disabled={loadingPassword}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: loadingPassword ? 'rgba(196, 183, 91, 0.3)' : 'rgba(196, 183, 91, 0.1)',
                        border: '1px solid rgba(196, 183, 91, 0.3)',
                        borderRadius: '0.25rem',
                        cursor: loadingPassword ? 'not-allowed' : 'pointer',
                        color: 'var(--imperial-emerald)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingPassword) {
                          e.currentTarget.style.background = 'rgba(196, 183, 91, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingPassword) {
                          e.currentTarget.style.background = 'rgba(196, 183, 91, 0.1)';
                        }
                      }}
                    >
                      {loadingPassword ? '⏳ Loading...' : '👁️ View Current Password'}
                    </button>
                  </div>
                  {currentPassword !== null && (
                    <div style={{ 
                      padding: '0.75rem', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.375rem',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            readOnly
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'white',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '0.25rem',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              paddingRight: '2.5rem'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.5rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              color: 'var(--muted-jade)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--imperial-emerald)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--muted-jade)';
                            }}
                            title={showCurrentPassword ? 'Hide password' : 'Show password'}
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(currentPassword);
                              showNotification('Password copied to clipboard!', 'success');
                            } catch (err) {
                              showNotification('Failed to copy to clipboard', 'error');
                            }
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            color: '#10b981',
                            fontWeight: '500',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                          }}
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'block', fontWeight: '500', fontSize: '0.875rem' }}>
                        Set New Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          // Generate a random secure password
                          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                          let password = '';
                          for (let i = 0; i < 12; i++) {
                            password += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setNewPassword(password);
                          setShowPassword(true); // Show the generated password
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(196, 183, 91, 0.1)',
                          border: '1px solid rgba(196, 183, 91, 0.3)',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: 'var(--imperial-emerald)',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(196, 183, 91, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(196, 183, 91, 0.1)';
                        }}
                      >
                        🎲 Generate Random
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input"
                        placeholder="Enter new password (minimum 8 characters)"
                        minLength={8}
                        required
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--muted-jade)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--imperial-emerald)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--muted-jade)';
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {newPassword && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600', marginBottom: '0.25rem' }}>
                              New Password (visible before saving):
                            </p>
                            <p style={{ 
                              fontSize: '1rem', 
                              fontFamily: 'monospace',
                              color: 'var(--imperial-emerald)',
                              fontWeight: '600',
                              letterSpacing: '0.05em',
                              wordBreak: 'break-all',
                              margin: 0
                            }}>
                              {newPassword}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(newPassword);
                              showNotification('Password copied to clipboard!', 'success');
                            }}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              color: '#059669',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                            }}
                          >
                            📋 Copy Password
                          </button>
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.5rem' }}>
                      ⚠️ <strong>Important:</strong> Copy this password before clicking &quot;Update Password&quot; - it cannot be retrieved after saving!
                    </p>
                  </div>
                  {newPassword && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                        Confirm New Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input"
                          placeholder="Confirm new password"
                          minLength={8}
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--muted-jade)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--imperial-emerald)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--muted-jade)';
                          }}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                          ⚠️ Passwords do not match
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && (
                        <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: '500' }}>
                          ✓ Passwords match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    // Generate a temporary password for password reset
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                    let tempPassword = '';
                    for (let i = 0; i < 12; i++) {
                      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    setNewPassword(tempPassword);
                    setConfirmPassword(tempPassword);
                    setShowPassword(true);
                    showNotification(`Temporary password generated: "${tempPassword}" - Copy it now!`, 'info');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: '#3b82f6',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                >
                  🔄 Reset Password (Generate New)
                </button>
                <button
                  type="button"
                    onClick={async () => {
                    if (newPassword && newPassword.length < 8) {
                      showNotification('Password must be at least 8 characters long', 'error');
                      return;
                    }
                    if (newPassword && newPassword !== confirmPassword) {
                      showNotification('Passwords do not match', 'error');
                      return;
                    }

                    if (!newPassword || newPassword.length < 8) {
                      showNotification('Please enter a new password (minimum 8 characters)', 'error');
                      return;
                    }

                    try {
                      const payload: any = {
                        name: selectedUser.name,
                        email: selectedUser.email,
                        role: selectedUser.role,
                        isActive: selectedUser.isActive,
                        password: newPassword,
                      };

                      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });

                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to update password');
                      }

                      // Store password before clearing (so admin can see what was set)
                      const passwordThatWasSet = newPassword;
                      
                      // Auto-copy password to clipboard
                      try {
                        await navigator.clipboard.writeText(passwordThatWasSet);
                      } catch (err) {
                        console.error('Failed to copy to clipboard:', err);
                      }
                      
                      // Show prominent success message with password
                      const successMessage = `Password Reset Complete!\n\nUser: ${selectedUser.name}\nEmail: ${selectedUser.email}\n\nNew Password: "${passwordThatWasSet}"\n\n✅ Password copied to clipboard!\n⚠️ Share this with the user - it cannot be retrieved later.`;
                      showNotification(successMessage, 'success');
                      
                      setNewPassword('');
                      setConfirmPassword('');
                      setShowPassword(false);
                      await fetchUsers();
                      // Keep details open but clear password fields
                    } catch (err: any) {
                      showNotification(err.message || 'Failed to update password', 'error');
                    }
                  }}
                  className="btn-primary"
                  disabled={!!(newPassword && newPassword !== confirmPassword)}
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(selectedUser);
                    setFormData({
                      name: selectedUser.name,
                      email: selectedUser.email,
                      password: '',
                      role: selectedUser.role,
                      isActive: selectedUser.isActive,
                    });
                    setShowDetails(false);
                    setShowForm(true);
                  }}
                  className="btn-secondary"
                >
                  Edit All Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

