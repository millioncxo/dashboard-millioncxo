import React from 'react';
import { Building2, User, CreditCard, Mail, Phone, Globe, MapPin, Calendar, CheckCircle2, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface ClientDetails {
  _id: string;
  businessName: string;
  fullRegisteredAddress?: string;
  pointOfContact: {
    name: string;
    title?: string;
    email: string;
    phone?: string;
  };
  websiteAddress?: string;
  country?: string;
  plan?: {
    _id: string;
    name: string;
    pricePerMonth: number;
    creditsPerMonth: number;
    description?: string;
  };
  accountManager?: {
    _id: string;
    name: string;
    email: string;
  };
  numberOfLicenses: number;
  targetThisMonth?: number;
  achievedThisMonth?: number;
  positiveResponsesTarget?: number;
  meetingsBookedTarget?: number;
  targetDeadline?: string;
  licenses: Array<{
    _id: string;
    productOrServiceName: string;
    serviceType: string;
    label: string;
    status: string;
    startDate: string;
    endDate?: string;
    isAssignedToSdr: boolean;
  }>;
  assignmentId: string;
  assignedAt: string;
}

interface ClientDetailPanelProps {
  clientDetails: ClientDetails | null;
  loading: boolean;
}

export default function ClientDetailPanel({ clientDetails, loading }: ClientDetailPanelProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--muted-jade)', fontSize: '0.875rem' }}>Loading workspace data...</p>
      </div>
    );
  }

  if (!clientDetails) {
    return null;
  }

  const InfoCard = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div style={{ 
      background: 'white', 
      padding: '1.25rem', 
      borderRadius: '0.75rem', 
      border: '1px solid rgba(196, 183, 91, 0.2)',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(196, 183, 91, 0.1)', paddingBottom: '0.5rem' }}>
        <Icon size={18} color="var(--imperial-emerald)" />
        <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </div>
  );

  const InfoItem = ({ label, value, icon: Icon, isLink = false }: { label: string, value: string | number, icon?: any, isLink?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--muted-jade)', fontWeight: '600', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.9375rem', color: 'var(--imperial-emerald)', fontWeight: '500' }}>
        {Icon && <Icon size={14} style={{ opacity: 0.7 }} />}
        {isLink ? (
          <a href={value.toString()} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--imperial-emerald)', textDecoration: 'none', borderBottom: '1px solid rgba(11, 46, 43, 0.2)' }}>
            {value}
          </a>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.25rem' 
      }}>
        <InfoCard title="Company" icon={Building2}>
          <InfoItem label="Legal Name" value={clientDetails.businessName} />
          {clientDetails.fullRegisteredAddress && <InfoItem label="Headquarters" value={clientDetails.fullRegisteredAddress} icon={MapPin} />}
          {clientDetails.websiteAddress && <InfoItem label="Website" value={clientDetails.websiteAddress} icon={Globe} isLink />}
        </InfoCard>

        <InfoCard title="Key Contact" icon={User}>
          <InfoItem label="Primary Person" value={`${clientDetails.pointOfContact.name}${clientDetails.pointOfContact.title ? ` (${clientDetails.pointOfContact.title})` : ''}`} />
          <InfoItem label="Email Address" value={clientDetails.pointOfContact.email} icon={Mail} />
          {clientDetails.pointOfContact.phone && <InfoItem label="Direct Phone" value={clientDetails.pointOfContact.phone} icon={Phone} />}
        </InfoCard>

        <InfoCard title="Account Details" icon={CreditCard}>
          {clientDetails.plan && (
            <>
              <InfoItem label="Current Plan" value={clientDetails.plan.name} icon={CheckCircle2} />
              <InfoItem label="Monthly Commitment" value={`$${clientDetails.plan.pricePerMonth.toLocaleString()}`} />
            </>
          )}
          <InfoItem label="Assigned Date" value={new Date(clientDetails.assignedAt).toLocaleDateString()} icon={Calendar} />
        </InfoCard>

        {/* Targets & Performance Card */}
        {(clientDetails.targetThisMonth !== undefined || clientDetails.positiveResponsesTarget !== undefined || clientDetails.meetingsBookedTarget !== undefined) && (
          <InfoCard title="Targets & Performance" icon={Target}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <InfoItem 
                label="Monthly Target" 
                value={clientDetails.targetThisMonth || clientDetails.numberOfLicenses || 0} 
                icon={TrendingUp} 
              />
              <InfoItem 
                label="Achieved So Far" 
                value={clientDetails.achievedThisMonth || 0} 
                icon={CheckCircle2} 
              />
              {clientDetails.positiveResponsesTarget !== undefined && (
                <InfoItem 
                  label="Positive Responses" 
                  value={clientDetails.positiveResponsesTarget} 
                  icon={Mail} 
                />
              )}
              {clientDetails.meetingsBookedTarget !== undefined && (
                <InfoItem 
                  label="Meetings Target" 
                  value={clientDetails.meetingsBookedTarget} 
                  icon={Calendar} 
                />
              )}
            </div>
            {clientDetails.targetDeadline && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.75rem', 
                background: 'rgba(196, 183, 91, 0.1)', 
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={14} color="var(--golden-opal)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
                  Deadline: {new Date(clientDetails.targetDeadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </InfoCard>
        )}
      </div>

      {/* Licenses Table Section */}
      {clientDetails.licenses.length > 0 && (
        <div style={{ 
          background: 'white', 
          borderRadius: '0.75rem', 
          border: '1px solid rgba(196, 183, 91, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(196, 183, 91, 0.05)', borderBottom: '1px solid rgba(196, 183, 91, 0.15)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
              Active Service Licenses ({clientDetails.licenses.length})
            </h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 46, 43, 0.02)', borderBottom: '1px solid rgba(196, 183, 91, 0.15)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Service Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Start Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: 'var(--imperial-emerald)', textTransform: 'uppercase' }}>Access</th>
                </tr>
              </thead>
              <tbody>
                {clientDetails.licenses.map((license) => (
                  <tr key={license._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--imperial-emerald)', fontWeight: '600' }}>
                      {license.productOrServiceName || license.label}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                      {license.serviceType}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        background: license.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: license.status === 'active' ? '#10b981' : '#6b7280',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {license.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-jade)' }}>
                      {license.startDate ? new Date(license.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {license.isAssignedToSdr ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--golden-opal)', textTransform: 'uppercase' }}>
                          Personal
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted-jade)', opacity: 0.5 }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

