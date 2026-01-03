interface Activity {
  type: string;
  title: string;
  description: string;
  date: string;
  clientId?: string;
  clientName?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  loading: boolean;
}

export default function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return null;
  }

  const activityColors: Record<string, string> = {
    INVOICE_GENERATED: '#f59e0b',
    PAYMENT_RECEIVED: '#10b981',
    CLIENT_CREATED: '#3b82f6',
    CLIENT_UPDATED: '#6366f1',
    SDR_ASSIGNED: '#8b5cf6',
    REPORT_CREATED: '#ec4899',
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
        Recent Activity (Last 5 Hours)
      </h3>
      {activities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activities.map((activity, index) => {
            const color = activityColors[activity.type] || 'var(--muted-jade)';

            return (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  borderLeft: `3px solid ${color}`,
                  background: 'rgba(11, 46, 43, 0.03)',
                  borderRadius: '0.375rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)', fontSize: '0.875rem' }}>
                    {activity.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)' }}>
                    {new Date(activity.date).toLocaleDateString()} {new Date(activity.date).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
                  {activity.description}
                </div>
                {activity.clientName && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    Client: {activity.clientName}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-jade)' }}>
          <p style={{ fontSize: '1rem' }}>No recent activity in the past 5 hours</p>
        </div>
      )}
    </div>
  );
}

