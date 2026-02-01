interface StatsCardsProps {
  clientsCount: number;
  totalLicenses: number;
  activeLicenses: number;
}

const statStyle = {
  label: { color: 'var(--muted-jade)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.25rem' },
  value: (color: string) => ({ fontSize: '1.5rem', fontWeight: '700', color, lineHeight: '1' as const }),
};

export default function StatsCards({ clientsCount, totalLicenses, activeLicenses }: StatsCardsProps) {
  return (
    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(11, 46, 43, 0.06)' }}>
      <div>
        <div style={statStyle.label}>Assigned Clients</div>
        <div style={statStyle.value('var(--imperial-emerald)')}>{clientsCount}</div>
      </div>
      <div>
        <div style={statStyle.label}>Total Licenses</div>
        <div style={statStyle.value('var(--imperial-emerald)')}>{totalLicenses}</div>
      </div>
      <div>
        <div style={statStyle.label}>Active Licenses</div>
        <div style={statStyle.value('#0d9488')}>{activeLicenses}</div>
      </div>
    </div>
  );
}

