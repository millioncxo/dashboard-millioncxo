'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';
import { 
  Edit, Receipt, UserPlus, Trash2, Search, Filter, 
  ChevronRight, Download, Plus, Building2, User, 
  Mail, Globe, MapPin, Phone, ShieldCheck, CreditCard,
  AlertCircle, Layout, List, History, StickyNote, X
} from 'lucide-react';
import { validateEmail, isValidEmail } from '@/lib/email-validation';
import NotificationContainer, { useNotifications } from '@/components/Notification';

interface Client {
  _id: string;
  businessName: string;
  fullRegisteredAddress: string;
  pointOfContactName: string;
  pointOfContactTitle?: string;
  pointOfContactEmail: string;
  additionalEmails?: string[];
  pointOfContactPhone?: string;
  websiteAddress?: string;
  country?: string;
  numberOfLicenses?: number;
  planType?: 'REGULAR' | 'POC';
  pricePerLicense?: number;
  currency?: 'USD' | 'INR';
  customPlanName?: string;
  accountManagerId?: { _id: string; name: string; email: string };
  currentPlanId?: { _id: string; name: string };
  sdrAssignments?: Array<{ sdrId: { name: string; email: string } }>;
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL';
  paymentDetails?: {
    amountRequested: number;
    numberOfMonths: number;
    paymentTerms?: string;
    dealClosedDate?: string;
    notes?: string;
  };
  contract?: {
    _id: string;
    fileId?: string;
    version?: string;
    signedDate?: Date;
    createdAt: Date;
  } | null;
  invoicesWithFiles?: Array<{
    _id: string;
    invoiceNumber?: string;
    fileId: string;
    createdAt: Date;
  }>;
}

interface Plan {
  _id: string;
  name: string;
  description: string;
  pricePerMonth: number;
  creditsPerMonth: number;
  planConfiguration?: {
    requiresSdrCount?: boolean;
    requiresLicenseCount?: boolean;
    fixedPrice?: boolean;
    pricePerSdr?: number;
    pricePerLicense?: number;
  };
}

interface LicenseInput {
  productOrServiceName: string;
  serviceType: string;
  label: string;
}

interface LicenseEditCardProps {
  license: {
    _id: string;
    productOrServiceName: string;
    serviceType: string;
    label: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  onUpdate: () => void;
}

function LicenseEditCard({ license, onUpdate }: LicenseEditCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    productOrServiceName: license.productOrServiceName,
    serviceType: license.serviceType,
    label: license.label,
    status: license.status,
    startDate: license.startDate ? new Date(license.startDate).toISOString().split('T')[0] : '',
    endDate: license.endDate ? new Date(license.endDate).toISOString().split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showNotification } = useNotifications();

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/licenses/${license._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update license');
      }

      showNotification('License updated successfully', 'success');
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update license', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this license? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/licenses/${license._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete license');
      }

      showNotification('License deleted successfully', 'success');
      onUpdate();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete license', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div style={{ 
        padding: '1.25rem', 
        background: 'white', 
        borderRadius: '1rem', 
        border: '1px solid var(--golden-opal)',
        boxShadow: '0 4px 12px rgba(196, 183, 91, 0.1)'
      }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                Product/Service
              </label>
              <input
                type="text"
                value={editData.productOrServiceName}
                onChange={(e) => setEditData({ ...editData, productOrServiceName: e.target.value })}
                className="input"
                required
                style={{ fontSize: '0.875rem', padding: '0.625rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                Type
              </label>
              <input
                type="text"
                value={editData.serviceType}
                onChange={(e) => setEditData({ ...editData, serviceType: e.target.value })}
                className="input"
                required
                style={{ fontSize: '0.875rem', padding: '0.625rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                Label
              </label>
              <input
                type="text"
                value={editData.label}
                onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                className="input"
                required
                style={{ fontSize: '0.875rem', padding: '0.625rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>
                Status
              </label>
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="input"
                required
                style={{ fontSize: '0.875rem', padding: '0.625rem' }}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem' }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditData({
                  productOrServiceName: license.productOrServiceName,
                  serviceType: license.serviceType,
                  label: license.label,
                  status: license.status,
                  startDate: license.startDate ? new Date(license.startDate).toISOString().split('T')[0] : '',
                  endDate: license.endDate ? new Date(license.endDate).toISOString().split('T')[0] : '',
                });
              }}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem' }}
              disabled={saving}
            >
              Cancel
            </button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={handleDelete}
              style={{ 
                fontSize: '0.8125rem', 
                padding: '0.5rem 1rem', 
                background: 'transparent', 
                color: '#dc2626',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
              disabled={saving || deleting}
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Remove License'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.25rem', 
      background: 'white', 
      borderRadius: '1rem', 
      border: '1px solid rgba(11, 46, 43, 0.05)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          background: 'rgba(11, 46, 43, 0.03)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--imperial-emerald)'
        }}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <div style={{ fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
            {license.productOrServiceName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600', textTransform: 'uppercase' }}>{license.serviceType}</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: '700', 
              color: license.status === 'active' ? '#10b981' : '#f59e0b',
              textTransform: 'uppercase'
            }}>
              {license.status}
            </span>
            {license.startDate && (
              <>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                  Started {new Date(license.startDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          background: 'white',
          border: '1px solid rgba(196, 183, 91, 0.3)',
          color: 'var(--imperial-emerald)',
          fontSize: '0.8125rem',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
      >
        <Edit size={14} />
        Configure
      </button>
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState<string | null>(null);
  const [invoiceGenerateData, setInvoiceGenerateData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amountOverride: '',
    description: '',
    dueDate: '',
    invoiceDate: '',
    invoiceNumber: '',
    paymentTerms: '',
    notes: '',
  });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [derivedEndDate, setDerivedEndDate] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    pointOfContactName: '',
    pointOfContactTitle: '',
    pointOfContactEmail: '',
    additionalEmails: [] as string[],
    pointOfContactPhone: '',
    websiteAddress: '',
    country: '',
    fullRegisteredAddress: '',
    currentPlanId: '',
    customPlanName: '', // For "Other" plan option
    planType: 'REGULAR' as 'REGULAR' | 'POC',
    pricePerLicense: 0,
    currency: 'USD' as 'USD' | 'INR',
    discountPercentage: 0,
    licenses: [] as LicenseInput[],
    numberOfLicenses: 0,
    numberOfSdrs: 0,
    positiveResponsesTarget: 0,
    meetingsBookedTarget: 0,
    paymentDetails: {
      numberOfMonths: 1,
      paymentTerms: '',
      dealClosedDate: '',
      notes: '',
    },
  });
  const [additionalEmailInput, setAdditionalEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [additionalEmailError, setAdditionalEmailError] = useState<string | null>(null);
  const [existingLicenses, setExistingLicenses] = useState<any[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  
  // Notification system
  const { notifications, showNotification, dismissNotification } = useNotifications();
  
  // Field-level errors (for red squiggly lines)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Helper function to parse field errors from error messages
  const parseFieldError = (errorMessage: string): { field: string; message: string } | null => {
    // Pattern: "fieldName: error message" or "parentField.childField: error message"
    const match = errorMessage.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      return {
        field: match[1].trim(),
        message: match[2].trim(),
      };
    }
    return null;
  };
  
  // Helper to set field error and show notification
  const handleError = (errorMessage: string) => {
    const parsed = parseFieldError(errorMessage);
    if (parsed) {
      // Set field-level error
      setFieldErrors((prev) => ({ ...prev, [parsed.field]: parsed.message }));
      // Show notification
      showNotification(errorMessage, 'error');
    } else {
      // Generic error
      showNotification(errorMessage, 'error');
    }
  };
  
  // Helper to clear field error
  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };
  
  // Helper to get error styling for a field
  const getFieldErrorStyle = (fieldName: string): React.CSSProperties => {
    if (fieldErrors[fieldName]) {
      return {
        borderColor: '#dc2626',
        borderWidth: '2px',
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(220, 38, 38, 0.1) 10px,
          rgba(220, 38, 38, 0.1) 20px
        )`,
        backgroundSize: '20px 20px',
      };
    }
    return {};
  };

  const fetchClients = useCallback(async () => {
    try {
      // Add timestamp to bypass cache and ensure fresh data
      const response = await fetch(`/api/admin/clients?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      
      // Force React to recognize the state change by creating a new array
      const clientsList = data.clients || [];
      
      // Set clients state
      setClients([...clientsList]);
      setFilteredClients([...clientsList]);
    } catch (err: any) {
      showNotification(`Failed to load clients: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [router, showNotification]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/plans');
      if (!response.ok) {
        console.error('Failed to fetch plans:', response.status, response.statusText);
        return;
      }
      const data = await response.json();
      if (data.success && data.plans) {
        setPlans(data.plans || []);
      } else {
        console.error('Invalid plans response:', data);
      }
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchPlans();
  }, [fetchClients, fetchPlans]);

  // Auto-calculate invoice due date based on selected month/year (last day of month)
  useEffect(() => {
    if (invoiceGenerateData.month && invoiceGenerateData.year) {
      const lastDay = new Date(invoiceGenerateData.year, invoiceGenerateData.month, 0);
      setInvoiceGenerateData((prev) => ({
        ...prev,
        dueDate: lastDay.toISOString().split('T')[0],
      }));
    }
  }, [invoiceGenerateData.month, invoiceGenerateData.year]);

  // Auto-calculate contract end date based on duration and deal closed date
  useEffect(() => {
    const months = formData.paymentDetails.numberOfMonths;
    const start = formData.paymentDetails.dealClosedDate;
    if (months && months > 0 && start) {
      const startDate = new Date(start);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      setDerivedEndDate(endDate.toISOString().split('T')[0]);
    } else {
      setDerivedEndDate('');
    }
  }, [formData.paymentDetails.numberOfMonths, formData.paymentDetails.dealClosedDate]);

  // Apply search filter when searchTerm or clients change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(client => 
      client.businessName.toLowerCase().includes(term) ||
      client.pointOfContactName.toLowerCase().includes(term) ||
      client.pointOfContactEmail.toLowerCase().includes(term) ||
      (client.pointOfContactTitle && client.pointOfContactTitle.toLowerCase().includes(term))
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError(null);

    // Clear previous field errors
    setFieldErrors({});
    
    // Validate main contact email
    const emailValidationError = validateEmail(formData.pointOfContactEmail);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      handleError(`pointOfContactEmail: ${emailValidationError}`);
      return;
    }

    // Validate additional emails
    for (let i = 0; i < formData.additionalEmails.length; i++) {
      const email = formData.additionalEmails[i];
      const validationError = validateEmail(email);
      if (validationError) {
        handleError(`additionalEmails[${i}]: ${validationError}`);
        return;
      }
    }

    try {
      const url = editingClient
        ? `/api/admin/clients/${editingClient._id}`
        : '/api/admin/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const payload: any = {
        businessName: formData.businessName,
        pointOfContactName: formData.pointOfContactName,
        pointOfContactTitle: formData.pointOfContactTitle,
        pointOfContactEmail: formData.pointOfContactEmail,
        additionalEmails: formData.additionalEmails,
        ...(formData.pointOfContactPhone && { pointOfContactPhone: formData.pointOfContactPhone }),
        ...(formData.websiteAddress && { websiteAddress: formData.websiteAddress }),
        ...(formData.country && { country: formData.country }),
        fullRegisteredAddress: formData.fullRegisteredAddress,
        currentPlanId: formData.currentPlanId === 'OTHER' ? null : (formData.currentPlanId || null),
        customPlanName: formData.currentPlanId === 'OTHER' ? formData.customPlanName : undefined,
        planType: formData.planType,
        pricePerLicense: formData.pricePerLicense,
        currency: formData.currency,
        numberOfLicenses: formData.numberOfLicenses,
        ...(formData.numberOfSdrs && formData.numberOfSdrs > 0 && { numberOfSdrs: formData.numberOfSdrs }),
        positiveResponsesTarget: formData.positiveResponsesTarget || 0,
        meetingsBookedTarget: formData.meetingsBookedTarget || 0,
      };

      // For new clients, include licenses
      if (!editingClient) {
        payload.licenses = formData.licenses;
      }

      // Add discount percentage
      if (formData.discountPercentage !== undefined) {
        payload.discountPercentage = Math.max(0, Math.min(100, formData.discountPercentage || 0));
      }
      
      // Always include payment details (even if empty) so they can be updated
      // Note: amountRequested is deprecated - calculated automatically from licenses and discount
      // Convert date input (YYYY-MM-DD) to ISO datetime format (YYYY-MM-DDTHH:mm:ssZ)
      let dealClosedDateISO = undefined;
      if (formData.paymentDetails.dealClosedDate) {
        // Date input gives YYYY-MM-DD, convert to ISO datetime (start of day in UTC)
        const date = new Date(formData.paymentDetails.dealClosedDate + 'T00:00:00Z');
        dealClosedDateISO = date.toISOString();
      }
      
      payload.paymentDetails = {
        numberOfMonths: formData.paymentDetails.numberOfMonths || 1,
        paymentTerms: formData.paymentDetails.paymentTerms || '',
        ...(dealClosedDateISO && { dealClosedDate: dealClosedDateISO }),
        notes: formData.paymentDetails.notes || '',
      };

      // Debug: Log payload for editing
      if (editingClient) {
        console.log('Updating client with payload:', payload);
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Update failed:', data);
        const errorMessage = data.error || 'Failed to save client';
        handleError(errorMessage);
        throw new Error(errorMessage);
      }

      // Store editing client ID before clearing it
      const updatedClientId = editingClient?._id;
      
      // Close form first to show the updated list
      setShowForm(false);
      const wasEditing = !!editingClient;
      setEditingClient(null);
      resetForm();
      setError('');
      
      // Refresh the clients list to get updated data
      await fetchClients();
      
      // Show success message
      const successMessage = wasEditing ? 'Client updated successfully!' : 'Client created successfully!';
      showNotification(successMessage, 'success');
    } catch (err: any) {
      // Error already shown as alert above, just log for debugging
      console.error('Client save error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      businessName: '',
      pointOfContactName: '',
      pointOfContactTitle: '',
      pointOfContactEmail: '',
      additionalEmails: [],
      pointOfContactPhone: '',
      websiteAddress: '',
      country: '',
      fullRegisteredAddress: '',
      currentPlanId: '',
      customPlanName: '',
      planType: 'REGULAR',
      pricePerLicense: 0,
      currency: 'USD',
      discountPercentage: 0,
      licenses: [],
      numberOfLicenses: 0,
      numberOfSdrs: 0,
      positiveResponsesTarget: 0,
      meetingsBookedTarget: 0,
      paymentDetails: {
        numberOfMonths: 1,
        paymentTerms: '',
        dealClosedDate: '',
        notes: '',
      },
    });
    setAdditionalEmailInput('');
    setEditingClient(null);
    setExistingLicenses([]);
  };

  const fetchClientLicenses = async (clientId: string) => {
    setLoadingLicenses(true);
    try {
      const response = await fetch(`/api/admin/licenses?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingLicenses(data.licenses || []);
      }
    } catch (err) {
      console.error('Failed to fetch licenses:', err);
      setExistingLicenses([]);
    } finally {
      setLoadingLicenses(false);
    }
  };

  const generateLicenses = async () => {
    if (!editingClient?._id) return;

    setLoadingLicenses(true);
    try {
      const response = await fetch(`/api/admin/clients/${editingClient._id}/generate-licenses`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate licenses');
      }

      const data = await response.json();
      showNotification(data.message || `Successfully generated ${data.licensesCreated || 0} license(s)`, 'success');
      
      // Refresh licenses list
      await fetchClientLicenses(editingClient._id);
    } catch (err: any) {
      showNotification(err.message || 'Failed to generate licenses', 'error');
    } finally {
      setLoadingLicenses(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    const clientWithPayment = client as any;
    setFormData({
      businessName: client.businessName,
      pointOfContactName: client.pointOfContactName,
      pointOfContactTitle: client.pointOfContactTitle || '',
      pointOfContactEmail: client.pointOfContactEmail,
      additionalEmails: client.additionalEmails || [],
      pointOfContactPhone: client.pointOfContactPhone || '',
      websiteAddress: client.websiteAddress || '',
      country: client.country || '',
      fullRegisteredAddress: client.fullRegisteredAddress,
      currentPlanId: client.currentPlanId?._id || '',
      customPlanName: clientWithPayment.customPlanName || '',
      planType: clientWithPayment.planType || 'REGULAR',
      pricePerLicense: clientWithPayment.pricePerLicense || 0,
      currency: clientWithPayment.currency || 'USD',
      discountPercentage: clientWithPayment.discountPercentage || 0,
      licenses: [],
      numberOfLicenses: clientWithPayment.numberOfLicenses || 0,
      numberOfSdrs: clientWithPayment.numberOfSdrs || 0,
      positiveResponsesTarget: clientWithPayment.positiveResponsesTarget || 0,
      meetingsBookedTarget: clientWithPayment.meetingsBookedTarget || 0,
      paymentDetails: clientWithPayment.paymentDetails ? {
        numberOfMonths: clientWithPayment.paymentDetails.numberOfMonths || 1,
        paymentTerms: clientWithPayment.paymentDetails.paymentTerms || '',
        dealClosedDate: clientWithPayment.paymentDetails.dealClosedDate 
          ? new Date(clientWithPayment.paymentDetails.dealClosedDate).toISOString().split('T')[0]
          : '',
        notes: clientWithPayment.paymentDetails.notes || '',
      } : {
        numberOfMonths: 1,
        paymentTerms: '',
        dealClosedDate: '',
        notes: '',
      },
    });
    // Fetch existing licenses for this client
    if (client._id) {
      fetchClientLicenses(client._id);
    }
    setShowForm(true);
  };


  const handleInvoiceGenerate = async (clientId: string, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Client Page] ===== INVOICE GENERATION HANDLER CALLED =====');
    console.log('[Client Page] Client ID:', clientId);
    console.log('[Client Page] Invoice Generate Data:', invoiceGenerateData);
    
    if (!invoiceGenerateData.month || !invoiceGenerateData.year) {
      console.error('[Client Page] Validation failed: Missing month or year');
      showNotification('Please select month and year', 'error');
      return;
    }

    if (!clientId) {
      console.error('[Client Page] Validation failed: Missing client ID');
      showNotification('Client ID is missing', 'error');
      return;
    }

    console.log('[Client Page] Starting invoice generation...');
    setGeneratingInvoice(true);
    setError('');

    try {
      const payload: any = {
        month: invoiceGenerateData.month,
        year: invoiceGenerateData.year,
      };

      // Add optional fields if provided
      if (invoiceGenerateData.amountOverride) {
        payload.amountOverride = parseFloat(invoiceGenerateData.amountOverride);
      }
      if (invoiceGenerateData.description) {
        payload.description = invoiceGenerateData.description;
      }
      if (invoiceGenerateData.dueDate) {
        payload.dueDate = invoiceGenerateData.dueDate;
      }
      if (invoiceGenerateData.invoiceDate) {
        payload.invoiceDate = invoiceGenerateData.invoiceDate;
      }
      if (invoiceGenerateData.invoiceNumber) {
        payload.invoiceNumber = invoiceGenerateData.invoiceNumber;
      }
      if (invoiceGenerateData.paymentTerms) {
        payload.paymentTerms = invoiceGenerateData.paymentTerms;
      }

      console.log('[Client Page] Sending invoice generation request:', {
        clientId,
        payload,
      });

      const response = await fetch(`/api/admin/clients/${clientId}/invoice/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[Client Page] Invoice generation response status:', response.status);

      const data = await response.json();
      console.log('[Client Page] Invoice generation response data:', data);

      if (!response.ok) {
        console.error('[Client Page] Invoice generation failed:', data);
        throw new Error(data.error || 'Failed to generate invoice');
      }

      setInvoiceGenerateData({ 
        month: new Date().getMonth() + 1, 
        year: new Date().getFullYear(),
        amountOverride: '',
        description: '',
        dueDate: '',
        invoiceDate: '',
        invoiceNumber: '',
        paymentTerms: '',
        notes: '',
      });
      setError('');
      console.log('[Client Page] Invoice generated successfully!');
      alert('Invoice generated successfully!');
      
      // Refresh invoices list if we're on the invoices page
      if (window.location.pathname.includes('/invoices')) {
        window.location.reload();
      }
      
      await fetchClients();
    } catch (err: any) {
      console.error('[Client Page] Invoice generation error:', err);
      console.error('[Client Page] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      showNotification(`Failed to generate invoice: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      console.log('[Client Page] Invoice generation handler finished');
      setGeneratingInvoice(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete client');
      }

      await fetchClients();
    } catch (err: any) {
      showNotification(`Failed to delete client: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const handleCreateAccount = async (clientId: string, e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accountFormData.name || !accountFormData.email || !accountFormData.password) {
      showNotification('Name, email, and password are required', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: accountFormData.name,
          email: accountFormData.email,
          password: accountFormData.password,
          role: 'CLIENT',
          clientId: clientId,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create login account');
      }

      setShowCreateAccount(null);
      setAccountFormData({ name: '', email: '', password: '' });
      setError('');
      alert('Login account created successfully!');
    } catch (err: any) {
      showNotification(`Failed to create login account: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const addAdditionalEmail = () => {
    if (!additionalEmailInput) {
      setAdditionalEmailError('Email is required');
      return;
    }

    const validationError = validateEmail(additionalEmailInput);
    if (validationError) {
      setAdditionalEmailError(validationError);
      return;
    }

    // Check if email already exists in the list
    if (formData.additionalEmails.includes(additionalEmailInput.trim().toLowerCase())) {
      setAdditionalEmailError('This email is already in the list');
      return;
    }

      setFormData({
        ...formData,
      additionalEmails: [...formData.additionalEmails, additionalEmailInput.trim().toLowerCase()],
      });
      setAdditionalEmailInput('');
    setAdditionalEmailError(null);
  };

  const removeAdditionalEmail = (index: number) => {
    setFormData({
      ...formData,
      additionalEmails: formData.additionalEmails.filter((_, i) => i !== index),
    });
  };

  const addLicense = () => {
    setFormData({
      ...formData,
      licenses: [...formData.licenses, { productOrServiceName: '', serviceType: '', label: '' }],
    });
  };

  const updateLicense = (index: number, field: keyof LicenseInput, value: string) => {
    const updatedLicenses = [...formData.licenses];
    updatedLicenses[index] = { ...updatedLicenses[index], [field]: value };
    setFormData({ ...formData, licenses: updatedLicenses });
  };

  const removeLicense = (index: number) => {
    setFormData({
      ...formData,
      licenses: formData.licenses.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--ivory-silk)' }}>
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
              Clients Management
            </h1>
            <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', fontWeight: '500' }}>
              Configure client portfolios, plans, and active licenses
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingClient(null);
              resetForm();
              setFieldErrors({});
              setShowForm(true);
            }}
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
            Register New Client
          </button>
        )}
      </div>

      {/* Error messages now shown as pop-up alerts instead of banners */}

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
              setEditingClient(null);
              resetForm();
            }
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '90vw',
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
                {editingClient ? 'Edit Client' : 'Create New Client'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingClient(null);
                  resetForm();
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
            <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
            {/* Client Information Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--imperial-emerald)', borderBottom: '2px solid var(--golden-opal)', paddingBottom: '0.5rem' }}>
                Client Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.pointOfContactName}
                    onChange={(e) => setFormData({ ...formData, pointOfContactName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Contact Title
                  </label>
                  <input
                    type="text"
                    value={formData.pointOfContactTitle}
                    onChange={(e) => setFormData({ ...formData, pointOfContactTitle: e.target.value })}
                    className="input"
                    placeholder="e.g., CEO, VP of Sales"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.pointOfContactEmail}
                    onChange={(e) => {
                      const email = e.target.value;
                      setFormData({ ...formData, pointOfContactEmail: email });
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
                  />
                  {emailError && (
                    <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                      {emailError}
                    </p>
                  )}
                  {!emailError && formData.pointOfContactEmail && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                      ✓ Valid email format
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Additional Emails
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="email"
                      value={additionalEmailInput}
                      onChange={(e) => {
                        const email = e.target.value;
                        setAdditionalEmailInput(email);
                        // Real-time validation
                        if (email) {
                          const validationError = validateEmail(email);
                          setAdditionalEmailError(validationError);
                        } else {
                          setAdditionalEmailError(null);
                        }
                      }}
                      onBlur={(e) => {
                        // Validate on blur as well
                        if (e.target.value) {
                          const validationError = validateEmail(e.target.value);
                          setAdditionalEmailError(validationError);
                        } else {
                          setAdditionalEmailError(null);
                        }
                      }}
                      className="input"
                      placeholder="Add email for dashboard access"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAdditionalEmail();
                        }
                      }}
                    />
                    {additionalEmailError && (
                      <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                        {additionalEmailError}
                      </p>
                    )}
                    {!additionalEmailError && additionalEmailInput && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                        ✓ Valid email format - Press Enter or click Add to include
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={addAdditionalEmail}
                      className="btn-secondary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Add
                    </button>
                  </div>
                  {formData.additionalEmails.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {formData.additionalEmails.map((email, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            background: 'rgba(196, 183, 91, 0.1)',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            color: 'var(--imperial-emerald)'
                          }}
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeAdditionalEmail(idx)}
                            style={{ cursor: 'pointer', color: '#dc2626' }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.pointOfContactPhone}
                    onChange={(e) => setFormData({ ...formData, pointOfContactPhone: e.target.value })}
                    className="input"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Website Address
                  </label>
                  <input
                    type="url"
                    value={formData.websiteAddress}
                    onChange={(e) => setFormData({ ...formData, websiteAddress: e.target.value })}
                    className="input"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input"
                    placeholder="e.g., United States"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Full Registered Address *
                  </label>
                  <textarea
                    value={formData.fullRegisteredAddress}
                    onChange={(e) => setFormData({ ...formData, fullRegisteredAddress: e.target.value })}
                    className="input"
                    required
                    rows={3}
                    placeholder="Complete registered business address"
                  />
                </div>
              </div>
            </div>

            {/* Service & Plan Information Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--imperial-emerald)', borderBottom: '2px solid var(--golden-opal)', paddingBottom: '0.5rem' }}>
                Service & Plan Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Plan Chosen *
                  </label>
                  <select
                    value={formData.currentPlanId}
                    onChange={(e) => {
                      const selectedPlanId = e.target.value;
                      const selectedPlan = plans.find(p => p._id === selectedPlanId);
                      
                      // Auto-populate fields from plan configuration
                      if (selectedPlan && selectedPlan.planConfiguration) {
                        const config = selectedPlan.planConfiguration;
                        const updates: any = {
                          currentPlanId: selectedPlanId,
                          customPlanName: selectedPlanId === 'OTHER' ? formData.customPlanName : '',
                        };
                        
                        // Auto-populate price per license if plan has it
                        if (config.pricePerLicense) {
                          updates.pricePerLicense = config.pricePerLicense;
                        }
                        
                        // Auto-populate price per SDR if plan has it
                        if (config.pricePerSdr && config.requiresSdrCount) {
                          // For SDR plans, we'll use pricePerSdr for calculation
                          updates.pricePerLicense = config.pricePerSdr;
                        }
                        
                        // Reset SDR count if switching away from SDR plan
                        if (!config.requiresSdrCount) {
                          updates.numberOfSdrs = 0;
                        }
                        
                        setFormData({ ...formData, ...updates });
                      } else {
                        setFormData({ ...formData, currentPlanId: selectedPlanId, customPlanName: selectedPlanId === 'OTHER' ? formData.customPlanName : '' });
                      }
                    }}
                    className="input"
                    required
                  >
                    <option value="">Select a plan</option>
                    {plans.map((plan) => {
                      // Format pricing based on plan type
                      let priceDisplay = '';
                      if (plan.name === 'LinkedIn Outreach Excellence 20X') {
                        priceDisplay = `$${plan.pricePerMonth}/license`;
                      } else if (plan.name === 'LinkedIn Followers Boost') {
                        priceDisplay = `$${plan.pricePerMonth}/month`;
                      } else if (plan.name === 'SDR as a Service') {
                        priceDisplay = `$${plan.pricePerMonth}/month`;
                      } else {
                        priceDisplay = `$${plan.pricePerMonth}/month`;
                      }
                      return (
                        <option key={plan._id} value={plan._id}>
                          {plan.name} - {priceDisplay}
                        </option>
                      );
                    })}
                    <option value="OTHER">Other (Custom Plan Name)</option>
                  </select>
                  {plans.length === 0 && (
                    <p style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.25rem' }}>
                      ⚠️ No plans found. Please run the seed script to create plans first.
                    </p>
                  )}
                  {formData.currentPlanId === 'OTHER' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={formData.customPlanName}
                        onChange={(e) => setFormData({ ...formData, customPlanName: e.target.value })}
                        className="input"
                        placeholder="Enter custom plan name"
                        required={formData.currentPlanId === 'OTHER'}
                      />
                    </div>
                  )}
                  {formData.currentPlanId && formData.currentPlanId !== 'OTHER' && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(196, 183, 91, 0.1)', borderRadius: '0.375rem' }}>
                      {(() => {
                        const selectedPlan = plans.find(p => p._id === formData.currentPlanId);
                        if (selectedPlan) {
                          return (
                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
                              <p style={{ fontWeight: '600', color: 'var(--imperial-emerald)', marginBottom: '0.25rem' }}>
                                {selectedPlan.name}
                              </p>
                              <p style={{ marginBottom: '0.25rem' }}>
                                {selectedPlan.description}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Plan Type *
                  </label>
                  <select
                    value={formData.planType}
                    onChange={(e) => setFormData({ ...formData, planType: e.target.value as 'REGULAR' | 'POC' })}
                    className="input"
                    required
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="POC">POC</option>
                  </select>
                </div>
                {(() => {
                  const selectedPlan = plans.find(p => p._id === formData.currentPlanId);
                  const requiresSdrCount = selectedPlan?.planConfiguration?.requiresSdrCount;
                  
                  if (requiresSdrCount) {
                    // Show SDR count input for SDR as a Service
                    return (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Number of SDRs *
                        </label>
                        <input
                          type="number"
                          value={formData.numberOfSdrs || ''}
                          onChange={(e) => setFormData({ ...formData, numberOfSdrs: parseInt(e.target.value) || 0 })}
                          className="input"
                          min="1"
                          max="10"
                          placeholder="Enter number of SDRs"
                          required
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                          Enter the number of SDRs (1-10)
                        </p>
                      </div>
                    );
                  } else {
                    // Show license count input for other plans
                    return (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Number of Licenses *
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfLicenses || ''}
                    onChange={(e) => setFormData({ ...formData, numberOfLicenses: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="1"
                    max="999"
                    placeholder="Enter number of licenses"
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                    Enter the number of licenses (1-999). License records will be auto-generated when you save.
                  </p>
                </div>
                    );
                  }
                })()}
                
                {/* License Records Management Section */}
                {formData.numberOfLicenses > 0 && editingClient && (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    marginTop: '1.5rem', 
                    padding: '1.5rem', 
                    background: 'rgba(196, 183, 91, 0.05)', 
                    borderRadius: '0.5rem', 
                    border: '1px solid rgba(196, 183, 91, 0.3)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--imperial-emerald)' }}>
                        License Records ({existingLicenses.length} of {formData.numberOfLicenses})
                      </h4>
                      <button
                        type="button"
                        onClick={() => fetchClientLicenses(editingClient._id)}
                        className="btn-secondary"
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        disabled={loadingLicenses}
                      >
                        {loadingLicenses ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                    {loadingLicenses ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" />
                      </div>
                    ) : existingLicenses.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                          No license records found. Click the button below to generate {formData.numberOfLicenses} license(s) based on the numberOfLicenses value.
                        </p>
                        <button
                          type="button"
                          onClick={generateLicenses}
                          className="btn-primary"
                          style={{ fontSize: '0.875rem', padding: '0.75rem 1.5rem' }}
                          disabled={loadingLicenses || !formData.numberOfLicenses || formData.numberOfLicenses === 0}
                        >
                          {loadingLicenses ? 'Generating...' : `Generate ${formData.numberOfLicenses} License(s)`}
                        </button>
                        {(!formData.numberOfLicenses || formData.numberOfLicenses === 0) && (
                          <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            Please set numberOfLicenses first
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        {existingLicenses.map((license) => (
                          <LicenseEditCard 
                            key={license._id} 
                            license={license} 
                            onUpdate={async () => {
                              await fetchClientLicenses(editingClient._id);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {(() => {
                  const selectedPlan = plans.find(p => p._id === formData.currentPlanId);
                  const fixedPrice = selectedPlan?.planConfiguration?.fixedPrice;
                  const requiresSdrCount = selectedPlan?.planConfiguration?.requiresSdrCount;
                  const label = requiresSdrCount ? 'Price Per SDR *' : 'Price Per License *';
                  
                  return (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        {label}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'USD' | 'INR' })}
                      className="input"
                      style={{ width: '100px', flexShrink: 0 }}
                    required
                          disabled={fixedPrice}
                    >
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                    </select>
                    <input
                      type="number"
                      value={formData.pricePerLicense}
                      onChange={(e) => setFormData({ ...formData, pricePerLicense: parseFloat(e.target.value) || 0 })}
                      className="input"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      style={{ flex: 1 }}
                          disabled={fixedPrice}
                          readOnly={fixedPrice}
                    />
                  </div>
                      {fixedPrice && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                          Price is fixed from plan configuration
                        </p>
                      )}
                </div>
                  );
                })()}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discountPercentage || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      discountPercentage: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                    })}
                    className="input"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                    Optional discount percentage (0-100%). Leave empty for no discount.
                  </p>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <div style={{ padding: '1.25rem', background: 'rgba(196, 183, 91, 0.1)', borderRadius: '0.5rem', border: '2px solid var(--golden-opal)' }}>
                    {(() => {
                      const selectedPlan = plans.find(p => p._id === formData.currentPlanId);
                      const requiresSdrCount = selectedPlan?.planConfiguration?.requiresSdrCount;
                      
                      // Calculate base cost based on plan type
                      let baseCost = 0;
                      let costDescription = '';
                      
                      if (requiresSdrCount) {
                        // SDR-based: numberOfSdrs × pricePerLicense (which is pricePerSdr)
                        baseCost = (formData.numberOfSdrs || 0) * formData.pricePerLicense;
                        costDescription = `${formData.numberOfSdrs || 0} SDRs × ${formData.currency} ${formData.pricePerLicense.toFixed(2)}`;
                      } else {
                        // License-based: numberOfLicenses × pricePerLicense
                        baseCost = formData.numberOfLicenses * formData.pricePerLicense;
                        costDescription = `${formData.numberOfLicenses} licenses × ${formData.currency} ${formData.pricePerLicense.toFixed(2)}`;
                      }
                      
                      const discountPercent = formData.discountPercentage || 0;
                      const discountAmount = baseCost > 0 && discountPercent > 0 ? (baseCost * discountPercent) / 100 : 0;
                      const finalCost = baseCost - discountAmount;
                      
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: discountPercent > 0 ? '0.75rem' : '0' }}>
                            <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.95rem' }}>Base Cost:</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--imperial-emerald)' }}>
                              {formData.currency} {baseCost.toFixed(2)}
                            </span>
                          </div>
                          {discountPercent > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', color: '#ef4444' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Discount ({discountPercent}%):</span>
                              <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                -{formData.currency} {discountAmount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: discountPercent > 0 ? '0.75rem' : '0', borderTop: discountPercent > 0 ? '2px solid var(--golden-opal)' : 'none' }}>
                            <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '1rem' }}>Total Cost of Service:</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--golden-opal)' }}>
                              {formData.currency} {finalCost.toFixed(2)}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                            {costDescription}
                            {discountPercent > 0 && ` - ${discountPercent}% discount`} = {formData.currency} {finalCost.toFixed(2)}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Configuration Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--imperial-emerald)', borderBottom: '2px solid var(--golden-opal)', paddingBottom: '0.5rem' }}>
                Target Configuration
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Set targets for SDR performance tracking. SDRs must report these values daily.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
                    Number of Positive Responses
                  </label>
                  <input
                    type="number"
                    value={formData.positiveResponsesTarget || ''}
                    onChange={(e) => setFormData({ ...formData, positiveResponsesTarget: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                    placeholder="0"
                    style={{ fontSize: '0.875rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                    Target number of positive responses
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
                    Number of Meetings Booked
                  </label>
                  <input
                    type="number"
                    value={formData.meetingsBookedTarget || ''}
                    onChange={(e) => setFormData({ ...formData, meetingsBookedTarget: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                    placeholder="0"
                    style={{ fontSize: '0.875rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                    Target number of meetings booked
                  </p>
                </div>
              </div>
            </div>

              {/* Licenses Section */}
              {!editingClient && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '500' }}>
                      Licenses Issued
                    </label>
                    <button
                      type="button"
                      onClick={addLicense}
                      className="btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      + Add License
                    </button>
                  </div>
                  {formData.licenses.length === 0 && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginBottom: '1rem', fontStyle: 'italic' }}>
                      No licenses added. Click &quot;Add License&quot; to add one.
                    </p>
                  )}
                  {formData.licenses.map((license, index) => (
                    <div key={index} className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(196, 183, 91, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <strong style={{ color: 'var(--imperial-emerald)' }}>License #{index + 1}</strong>
                        <button
                          type="button"
                          onClick={() => removeLicense(index)}
                          style={{ color: '#dc2626', cursor: 'pointer', fontSize: '1.25rem' }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Product or Service Name *
                          </label>
                          <input
                            type="text"
                            value={license.productOrServiceName}
                            onChange={(e) => updateLicense(index, 'productOrServiceName', e.target.value)}
                            className="input"
                            required
                            placeholder="e.g., LinkedIn Outreach Excellence 20X"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Service Type *
                          </label>
                          <input
                            type="text"
                            value={license.serviceType}
                            onChange={(e) => updateLicense(index, 'serviceType', e.target.value)}
                            className="input"
                            required
                            placeholder="e.g., LinkedIn Outreach, Email Campaign"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            License Label *
                          </label>
                          <input
                            type="text"
                            value={license.label}
                            onChange={(e) => updateLicense(index, 'label', e.target.value)}
                            className="input"
                            required
                            placeholder="e.g., LinkedIn Premium, Email Pro"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* Payment Information Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--imperial-emerald)', borderBottom: '2px solid var(--golden-opal)', paddingBottom: '0.5rem' }}>
                Payment Information & Deal Details
              </h3>
              <p style={{ color: 'var(--muted-jade)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Payment amount is calculated automatically from licenses and discount. Payments are tracked month-wise through invoices.
              </p>
              
              {/* Contract Duration and End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Contract Duration (Months) *
                    </label>
                    <input
                      type="number"
                      value={formData.paymentDetails.numberOfMonths || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        paymentDetails: {
                          ...formData.paymentDetails,
                          numberOfMonths: parseInt(e.target.value) || 1,
                        },
                      })}
                      className="input"
                      placeholder="1"
                      min="1"
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                      Number of months for this contract/engagement
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Deal Closed Date (Start)
                    </label>
                    <input
                      type="date"
                      value={formData.paymentDetails.dealClosedDate || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          paymentDetails: {
                            ...formData.paymentDetails,
                            dealClosedDate: e.target.value,
                          },
                        });
                        // Clear error when user starts typing
                        clearFieldError('paymentDetails.dealClosedDate');
                      }}
                      className="input"
                      style={{
                        ...(fieldErrors['paymentDetails.dealClosedDate'] && {
                          borderColor: '#dc2626',
                          borderWidth: '2px',
                          backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 10px,
                            rgba(220, 38, 38, 0.1) 10px,
                            rgba(220, 38, 38, 0.1) 20px
                          )`,
                          backgroundSize: '20px 20px',
                        }),
                      }}
                      title={fieldErrors['paymentDetails.dealClosedDate'] || ''}
                    />
                    {fieldErrors['paymentDetails.dealClosedDate'] ? (
                      <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: '500' }}>
                        ⚠️ {fieldErrors['paymentDetails.dealClosedDate']}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                        Date when the deal was closed/signed
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      End Date (Auto)
                    </label>
                    <input
                      type="date"
                      value={derivedEndDate || ''}
                      readOnly
                      className="input"
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                      Automatically calculated from start date + duration
                    </p>
                  </div>
                </div>
            </div>
                
            {/* Invoice Generation Section */}
            {editingClient && (
              <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(11,46,43,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(196, 183, 91, 0.2)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--imperial-emerald)', borderBottom: '2px solid var(--golden-opal)', paddingBottom: '0.5rem' }}>
                  Generate Monthly Invoice
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-jade)', marginBottom: '1.25rem' }}>
                  Generate invoice PDF for a specific month. Invoice will be automatically calculated based on client plan, licenses, and SDRs.
                </p>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Month *
                          </label>
                          <select
                            value={invoiceGenerateData.month}
                            onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, month: parseInt(e.target.value) })}
                            className="input"
                            required
                          >
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Year *
                          </label>
                          <input
                            type="number"
                            value={invoiceGenerateData.year}
                            onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, year: parseInt(e.target.value) })}
                            className="input"
                            min="2020"
                            max="2100"
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Invoice Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={invoiceGenerateData.invoiceDate}
                            onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, invoiceDate: e.target.value })}
                            className="input"
                          />
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                            Defaults to first day of month if not specified
                          </p>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Due Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={invoiceGenerateData.dueDate}
                            onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, dueDate: e.target.value })}
                            className="input"
                          />
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                            Defaults to last day of month if not specified
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Invoice Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={invoiceGenerateData.invoiceNumber}
                            onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, invoiceNumber: e.target.value })}
                            className="input"
                            placeholder="Auto-generated if not provided"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Amount Override (Optional)
                          </label>
                          <input
                            type="number"
                            value={invoiceGenerateData.amountOverride}
                            onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, amountOverride: e.target.value })}
                            className="input"
                            step="0.01"
                            min="0"
                            placeholder="Override calculated amount"
                          />
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem' }}>
                            Leave empty to use calculated amount
                          </p>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Payment Terms (Optional)
                          </label>
                          <input
                            type="text"
                            value={invoiceGenerateData.paymentTerms}
                            onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, paymentTerms: e.target.value })}
                            className="input"
                            placeholder="e.g., Net 30, Due on receipt"
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Description (Optional)
                        </label>
                        <textarea
                          value={invoiceGenerateData.description}
                          onChange={(e) => setInvoiceGenerateData({ ...invoiceGenerateData, description: e.target.value })}
                          className="input"
                          rows={2}
                          placeholder="Custom service description (overrides auto-generated)"
                        />
                      </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        
                        if (!editingClient?._id) {
                          alert('Error: No client selected. Please edit a client first.');
                          return;
                        }
                        
                        if (!invoiceGenerateData.month || !invoiceGenerateData.year) {
                          alert('Please select both month and year');
                          return;
                        }
                        
                        await handleInvoiceGenerate(editingClient._id, e);
                      }}
                      className="btn-primary"
                      disabled={generatingInvoice || !editingClient?._id}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceGenerateData({ 
                          month: new Date().getMonth() + 1, 
                          year: new Date().getFullYear(),
                          amountOverride: '',
                          description: '',
                          dueDate: '',
                          invoiceDate: '',
                          invoiceNumber: '',
                          paymentTerms: '',
                          notes: '',
                        });
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', flexDirection: 'column' }}>
                {editingClient && (
                  <button
                    type="button"
                    onClick={() => setShowCreateAccount(editingClient._id)}
                    className="btn-secondary"
                    style={{
                      background: 'rgba(196, 183, 91, 0.1)',
                      borderColor: 'var(--golden-opal)',
                      color: 'var(--imperial-emerald)',
                      alignSelf: 'flex-start'
                    }}
                  >
                    <UserPlus size={16} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
                    Create Account
                  </button>
                )}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary">
                    {editingClient ? 'Update Client' : 'Create Client'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingClient(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  {editingClient && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingClient._id)}
                      className="btn-secondary"
                      style={{
                        background: '#fee2e2',
                        borderColor: '#dc2626',
                        color: '#dc2626'
                      }}
                    >
                      <Trash2 size={16} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
                      Delete Client
                    </button>
                  )}
                </div>
              </div>

              {/* Account creation - shown inside modal when editing */}
              {editingClient && (
                <>
                  {showCreateAccount === editingClient._id && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(196, 183, 91, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(196, 183, 91, 0.3)' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--imperial-emerald)' }}>
                        Create Login Account for {editingClient.businessName}
                      </h4>
                      <form onSubmit={(e) => handleCreateAccount(editingClient._id, e)}>
                        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                              Name *
                            </label>
                            <input
                              type="text"
                              value={accountFormData.name}
                              onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                              className="input"
                              required
                              placeholder={editingClient.pointOfContactName}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                              Email *
                            </label>
                            <input
                              type="email"
                              value={accountFormData.email}
                              onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                              className="input"
                              required
                              placeholder={editingClient.pointOfContactEmail}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                              Password *
                            </label>
                            <input
                              type="password"
                              value={accountFormData.password}
                              onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                              className="input"
                              required
                              minLength={6}
                              placeholder="Minimum 6 characters"
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="submit" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                            Create Account
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateAccount(null);
                              setAccountFormData({ name: '', email: '', password: '' });
                            }}
                            className="btn-secondary"
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
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
                placeholder="Search by business name, contact, or email..."
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
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'rgba(11, 46, 43, 0.05)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  color: 'var(--imperial-emerald)',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
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
                  Registered Clients
                </h2>
                <p style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontWeight: '500', marginTop: '0.25rem' }}>
                  {filteredClients.length} clients in current view
                </p>
              </div>
            </div>

            {filteredClients.length === 0 ? (
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
                  <Building2 size={32} />
                </div>
                <p style={{ color: 'var(--muted-jade)', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '500' }}>
                  No clients found.
                </p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="btn-primary" 
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(11, 46, 43, 0.02)' }}>
                      {['Business Name', 'Contact Information', 'Active Seats', 'Portfolio Value', 'Actions'].map((header) => (
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
                    {filteredClients.map((client) => (
                      <tr 
                        key={client._id}
                        style={{ 
                          borderBottom: '1px solid rgba(196, 183, 91, 0.08)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleEdit(client)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 183, 91, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontWeight: '750', color: 'var(--imperial-emerald)', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                            {client.businessName}
                          </div>
                          {client.country && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                              <Globe size={12} />
                              {client.country}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>
                              {client.pointOfContactName}
                              {client.pointOfContactTitle && (
                                <span style={{ color: 'var(--muted-jade)', fontWeight: '500', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                  ({client.pointOfContactTitle})
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.125rem', fontWeight: '500' }}>
                              <Mail size={12} />
                              {client.pointOfContactEmail}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '2rem',
                            background: 'rgba(11, 46, 43, 0.05)',
                            color: 'var(--imperial-emerald)',
                            fontWeight: '700',
                            fontSize: '0.8125rem'
                          }}>
                            <ShieldCheck size={14} />
                            {client.numberOfLicenses ?? 0}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          {(() => {
                            const baseCost = (client.numberOfLicenses || 0) * ((client as any).pricePerLicense || 0);
                            const discountPercent = (client as any).discountPercentage || 0;
                            const discountAmount = baseCost > 0 && discountPercent > 0 ? (baseCost * discountPercent) / 100 : 0;
                            const finalCost = baseCost - discountAmount;
                            const currencySymbol = (client as any).currency === 'INR' ? '₹' : '$';
                            
                            if (baseCost > 0) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ fontWeight: '800', color: 'var(--imperial-emerald)', fontSize: '0.9375rem' }}>
                                    {currencySymbol}{finalCost.toLocaleString()}
                                  </div>
                                  {discountPercent > 0 && (
                                    <span style={{ fontSize: '0.6875rem', color: '#dc2626', fontWeight: '700', background: '#fee2e2', padding: '0.125rem 0.375rem', borderRadius: '4px', width: 'fit-content', marginTop: '0.25rem' }}>
                                      {discountPercent}% SAVING
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return <span style={{ color: 'var(--muted-jade)', fontSize: '0.8125rem', fontStyle: 'italic', fontWeight: '500' }}>No plan active</span>;
                          })()}
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleEdit(client)}
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
                              title="Edit Client"
                            >
                              <Edit size={16} />
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
        </>
      )}
    </div>
  );
}
