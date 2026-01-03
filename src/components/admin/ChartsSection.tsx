import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  revenueTrend?: Array<{ month: string; revenue: number; paid: number }>;
  clientGrowth?: Array<{ month: string; totalClients: number }>;
}

interface ChartsSectionProps {
  chartData: ChartData | null;
  loading: boolean;
}

export default function ChartsSection({ chartData, loading }: ChartsSectionProps) {
  if (loading || !chartData) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Revenue Trend Chart */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(11, 46, 43, 0.02) 0%, rgba(196, 183, 91, 0.02) 100%)', border: '1px solid rgba(196, 183, 91, 0.2)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
          Revenue Trend (Last 12 Months)
        </h3>
        {chartData.revenueTrend && chartData.revenueTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData.revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(11, 46, 43, 0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--muted-jade)"
                style={{ fontSize: '0.75rem' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="var(--muted-jade)"
                style={{ fontSize: '0.75rem' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                domain={[0, 50000]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid rgba(196, 183, 91, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}
                formatter={(value: number | undefined) => {
                  if (value === undefined) return ['$0.00', ''];
                  return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ''];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '1rem' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--imperial-emerald)" 
                strokeWidth={3}
                dot={{ fill: 'var(--imperial-emerald)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Revenue" 
              />
              <Line 
                type="monotone" 
                dataKey="paid" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Paid Revenue" 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px', color: 'var(--muted-jade)' }}>
            <p>No revenue data available</p>
          </div>
        )}
      </div>

      {/* Client Growth Chart */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(11, 46, 43, 0.02) 0%, rgba(196, 183, 91, 0.02) 100%)', border: '1px solid rgba(196, 183, 91, 0.2)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--imperial-emerald)' }}>
          Client Growth (Last 12 Months)
        </h3>
        {chartData.clientGrowth && chartData.clientGrowth.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData.clientGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(11, 46, 43, 0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--muted-jade)"
                style={{ fontSize: '0.75rem' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="var(--muted-jade)"
                style={{ fontSize: '0.75rem' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid rgba(196, 183, 91, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '1rem' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="totalClients" 
                stroke="var(--imperial-emerald)" 
                strokeWidth={3}
                dot={{ fill: 'var(--imperial-emerald)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Clients" 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px', color: 'var(--muted-jade)' }}>
            <p>No client data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

