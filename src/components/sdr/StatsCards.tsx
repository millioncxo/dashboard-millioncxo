interface StatsCardsProps {
  clientsCount: number;
  totalLicenses: number;
  activeLicenses: number;
}

export default function StatsCards({ clientsCount, totalLicenses, activeLicenses }: StatsCardsProps) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '1.25rem', 
      marginBottom: '1.5rem' 
    }}>
      {/* Clients Card */}
      <div className="card" style={{ 
        position: 'relative',
        overflow: 'hidden',
        background: 'white',
        border: '1px solid rgba(196, 183, 91, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        padding: '1.25rem 1.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
      }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{ 
            color: 'var(--muted-jade)', 
            fontWeight: '600', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Assigned Clients
          </div>
          <div style={{ 
            fontSize: '2.25rem', 
            fontWeight: '800', 
            color: 'var(--imperial-emerald)', 
            lineHeight: '1'
          }}>
            {clientsCount}
          </div>
        </div>
      </div>

      {/* Total Licenses Card */}
      <div className="card" style={{ 
        position: 'relative',
        overflow: 'hidden',
        background: 'white',
        border: '1px solid rgba(196, 183, 91, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        padding: '1.25rem 1.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
      }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{ 
            color: 'var(--muted-jade)', 
            fontWeight: '600', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Total Licenses
          </div>
          <div style={{ 
            fontSize: '2.25rem', 
            fontWeight: '800', 
            color: 'var(--imperial-emerald)', 
            lineHeight: '1'
          }}>
            {totalLicenses}
          </div>
        </div>
      </div>

      {/* Active Licenses Card */}
      <div className="card" style={{ 
        position: 'relative',
        overflow: 'hidden',
        background: 'white',
        border: '1px solid rgba(196, 183, 91, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        padding: '1.25rem 1.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
      }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{ 
            color: 'var(--muted-jade)', 
            fontWeight: '600', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Active Licenses
          </div>
          <div style={{ 
            fontSize: '2.25rem', 
            fontWeight: '800', 
            color: '#10b981', 
            lineHeight: '1'
          }}>
            {activeLicenses}
          </div>
        </div>
      </div>
    </div>
  );
}

