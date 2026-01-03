'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { Column } from './DataTable';
import FilterBar, { FilterState } from './FilterBar';

interface Update {
  _id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'REPORT' | 'OTHER';
  title: string;
  description: string;
  date: string;
  sdrId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  attachments?: string[];
}

interface UpdatesTableProps {
  clientId: string;
  onExport?: (updates: Update[]) => void;
  refreshTrigger?: number; // Trigger refresh when this changes
}

const TYPE_COLORS: Record<Update['type'], string> = {
  CALL: '#3b82f6',
  EMAIL: '#10b981',
  MEETING: '#f59e0b',
  NOTE: 'var(--golden-opal)',
  REPORT: '#8b5cf6',
  OTHER: 'var(--muted-jade)',
};

export default function UpdatesTable({ clientId, onExport, refreshTrigger }: UpdatesTableProps) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    dateFrom: '',
    dateTo: '',
  });
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.types.length > 0) {
        params.append('type', filters.types.join(','));
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/sdr/clients/${clientId}/updates?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch updates');
      }

      const data = await response.json();
      setUpdates(data.updates || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId, pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates, refreshTrigger]);

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on sort
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter
  };

  const handleExport = () => {
    if (onExport) {
      onExport(updates);
    } else {
      // Default CSV export
      const headers = ['Date', 'Type', 'Title', 'Description', 'SDR', 'Created'];
      const rows = updates.map(update => [
        new Date(update.date).toLocaleDateString(),
        update.type,
        update.title,
        update.description.replace(/,/g, ';'), // Replace commas in description
        update.sdrId.name,
        new Date(update.createdAt).toLocaleString(),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `updates-${clientId}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const columns: Column<Update>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      width: '120px',
      render: (value) => (
        <span style={{ fontSize: '0.875rem' }}>
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: '100px',
      render: (value) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: `${TYPE_COLORS[value as Update['type']]}20`,
          color: TYPE_COLORS[value as Update['type']],
          textTransform: 'uppercase',
        }}>
          {value}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <span style={{ fontWeight: '600', color: 'var(--imperial-emerald)' }}>
          {value}
        </span>
      ),
    },
    {
      key: 'sdrId',
      label: 'SDR',
      sortable: false,
      width: '150px',
      render: (value, row) => (
        <span style={{ fontSize: '0.875rem' }}>
          {row.sdrId.name}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      width: '150px',
      render: (value) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)' }}>
          {new Date(value).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          onClick={handleExport}
          style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600',
            padding: '0.375rem 0.75rem',
            background: 'white',
            border: '1px solid rgba(196, 183, 91, 0.3)',
            borderRadius: '0.5rem',
            color: 'var(--imperial-emerald)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          📥 Export Workspace Logs
        </button>
      </div>

      <FilterBar
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        showDateRange={true}
        showTypeFilter={true}
        showSearch={true}
      />

      <DataTable
        data={updates}
        columns={columns}
        loading={loading}
        emptyMessage="No workspace logs found for this client."
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        expandableRow={(row) => (
          <div style={{ padding: '1.25rem', background: 'rgba(11, 46, 43, 0.03)', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--imperial-emerald)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Log Description:</strong>
              <p style={{ marginTop: '0.5rem', color: 'var(--imperial-emerald)', lineHeight: '1.6', fontSize: '0.875rem' }}>
                {row.description}
              </p>
            </div>
            {row.attachments && row.attachments.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <strong style={{ color: 'var(--imperial-emerald)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference Files:</strong>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {row.attachments.map((attachment, idx) => (
                    <a
                      key={idx}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'white',
                        border: '1px solid rgba(196, 183, 91, 0.2)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--imperial-emerald)',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}
                    >
                      📎 File {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}

