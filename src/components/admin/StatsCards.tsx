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

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading || !stats) {
    return null;
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '0.75rem', 
      marginBottom: '1.5rem' 
    }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ color: 'var(--muted-jade)', fontSize: '0.8rem', marginBottom: '0.375rem' }}>Total Clients</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--imperial-emerald)' }}>
          {stats.totalClients}
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ color: 'var(--muted-jade)', fontSize: '0.8rem', marginBottom: '0.375rem' }}>Total Revenue</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--imperial-emerald)' }}>
          ${stats.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ color: 'var(--muted-jade)', fontSize: '0.8rem', marginBottom: '0.375rem' }}>Total SDRs</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--imperial-emerald)' }}>
          {stats.totalSdrs}
        </div>
      </div>
    </div>
  );
}

