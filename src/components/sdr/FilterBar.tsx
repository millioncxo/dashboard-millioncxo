'use client';

import { useState, useEffect } from 'react';

export interface FilterState {
  search: string;
  types: string[];
  dateFrom: string;
  dateTo: string;
}

interface FilterType {
  value: string;
  label: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  updateTypes?: (string | FilterType)[];
  showDateRange?: boolean;
  showTypeFilter?: boolean;
  showSearch?: boolean;
}

const UPDATE_TYPES = [
  { value: 'CALL', label: 'Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'NOTE', label: 'Note' },
  { value: 'REPORT', label: 'Report' },
  { value: 'OTHER', label: 'Other' },
];

export default function FilterBar({
  onFilterChange,
  initialFilters = {},
  updateTypes = UPDATE_TYPES,
  showDateRange = true,
  showTypeFilter = true,
  showSearch = true,
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: initialFilters.search || '',
    types: initialFilters.types || [],
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  };

  const handleQuickDate = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (range) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'week':
        from.setDate(today.getDate() - 7);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'month':
        from.setMonth(today.getMonth() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
    }

    setFilters(prev => ({
      ...prev,
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0],
    }));
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      types: [],
      dateFrom: '',
      dateTo: '',
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = filters.search || filters.types.length > 0 || filters.dateFrom || filters.dateTo;

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        {showSearch && (
          <div style={{ flex: '1 1 250px', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search updates..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input"
              style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
            />
          </div>
        )}

        {showTypeFilter && (
          <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
              Filter by Type
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {updateTypes.map((type) => {
                const typeObj = typeof type === 'string' 
                  ? UPDATE_TYPES.find(t => t.value === type) || { value: type, label: type }
                  : type;
                const isSelected = filters.types.includes(typeObj.value);
                return (
                  <button
                    key={typeObj.value}
                    type="button"
                    onClick={() => handleTypeToggle(typeObj.value)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: `1px solid ${isSelected ? 'var(--golden-opal)' : 'rgba(196, 183, 91, 0.3)'}`,
                      borderRadius: '0.375rem',
                      background: isSelected ? 'rgba(196, 183, 91, 0.2)' : 'white',
                      color: isSelected ? 'var(--imperial-emerald)' : 'var(--muted-jade)',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(196, 183, 91, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    {typeObj.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showDateRange && (
          <>
            <div style={{ flex: '0 1 150px', minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="input"
                style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
              />
            </div>
            <div style={{ flex: '0 1 150px', minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="input"
                style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
              />
            </div>
            <div style={{ flex: '0 1 auto' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--imperial-emerald)' }}>
                Quick Filters
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickDate('today')}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('week')}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('month')}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                >
                  Last Month
                </button>
              </div>
            </div>
          </>
        )}

        {hasActiveFilters && (
          <div style={{ flex: '0 0 auto' }}>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(196, 183, 91, 0.2)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '600' }}>Active Filters:</span>
            {filters.search && (
              <span style={{
                padding: '0.25rem 0.75rem',
                background: 'rgba(196, 183, 91, 0.2)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--imperial-emerald)',
              }}>
                Search: &quot;{filters.search}&quot;
              </span>
            )}
            {filters.types.length > 0 && (
              <span style={{
                padding: '0.25rem 0.75rem',
                background: 'rgba(196, 183, 91, 0.2)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--imperial-emerald)',
              }}>
                Types: {filters.types.join(', ')}
              </span>
            )}
            {filters.dateFrom && (
              <span style={{
                padding: '0.25rem 0.75rem',
                background: 'rgba(196, 183, 91, 0.2)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--imperial-emerald)',
              }}>
                From: {new Date(filters.dateFrom).toLocaleDateString()}
              </span>
            )}
            {filters.dateTo && (
              <span style={{
                padding: '0.25rem 0.75rem',
                background: 'rgba(196, 183, 91, 0.2)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--imperial-emerald)',
              }}>
                To: {new Date(filters.dateTo).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

