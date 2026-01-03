'use client';

import React, { useState, useMemo } from 'react';

import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  onRowClick?: (row: T) => void;
  expandableRow?: (row: T) => React.ReactNode;
  className?: string;
}

export default function DataTable<T extends { _id: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No records found',
  onSort,
  sortBy,
  sortOrder,
  pagination,
  onRowClick,
  expandableRow,
  className = '',
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    const column = columns.find(c => c.key === columnKey);
    if (!column?.sortable) return;

    const newOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newOrder);
  };

  const toggleRow = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortBy !== columnKey) {
      return <ChevronsUpDown size={14} style={{ marginLeft: '0.5rem', color: 'var(--muted-jade)', opacity: 0.5 }} />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp size={14} style={{ marginLeft: '0.5rem', color: 'var(--imperial-emerald)' }} /> : 
      <ChevronDown size={14} style={{ marginLeft: '0.5rem', color: 'var(--imperial-emerald)' }} />;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--muted-jade)' }}>Loading data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--muted-jade)', fontSize: '1rem' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ 
              background: 'rgba(11, 46, 43, 0.05)',
              borderBottom: '2px solid rgba(196, 183, 91, 0.3)'
            }}>
              {expandableRow && (
                <th style={{ 
                  padding: '0.75rem', 
                  width: '40px',
                  textAlign: 'center'
                }}></th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: column.align || 'left',
                    fontWeight: '600',
                    color: 'var(--imperial-emerald)',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: column.sortable ? 'pointer' : 'default',
                    width: column.width,
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                  onMouseEnter={(e) => {
                    if (column.sortable) {
                      e.currentTarget.style.background = 'rgba(196, 183, 91, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {column.label}
                    {column.sortable && <SortIcon columnKey={column.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <React.Fragment key={row._id}>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(196, 183, 91, 0.15)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.2s ease',
                  }}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(196, 183, 91, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '';
                  }}
                >
                  {expandableRow && (
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(row._id);
                        }}
                        style={{
                          background: 'rgba(196, 183, 91, 0.1)',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          color: 'var(--imperial-emerald)',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          margin: '0 auto'
                        }}
                      >
                        {expandedRows.has(row._id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: column.align || 'left',
                        fontSize: '0.875rem',
                        color: 'var(--muted-jade)',
                      }}
                    >
                      {column.render
                        ? column.render((row as any)[column.key], row)
                        : String((row as any)[column.key] || '')}
                    </td>
                  ))}
                </tr>
                {expandableRow && expandedRows.has(row._id) && (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ padding: '1rem', background: 'rgba(196, 183, 91, 0.02)' }}>
                      {expandableRow(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '1.5rem',
          padding: '1rem',
          borderTop: '1px solid rgba(196, 183, 91, 0.2)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-jade)' }}>
            <span>Showing</span>
            <select
              value={pagination.limit}
              onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid rgba(196, 183, 91, 0.3)',
                borderRadius: '0.25rem',
                background: 'white',
                color: 'var(--imperial-emerald)',
                fontSize: '0.875rem',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>of {pagination.total} entries</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              style={{
                padding: '0.5rem',
                border: '1px solid rgba(196, 183, 91, 0.3)',
                borderRadius: '0.5rem',
                background: pagination.page === 1 ? 'rgba(0,0,0,0.02)' : 'white',
                color: pagination.page === 1 ? 'var(--muted-jade)' : 'var(--imperial-emerald)',
                cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0 1rem', 
              height: '34px',
              background: 'rgba(11, 46, 43, 0.05)',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--imperial-emerald)',
              fontWeight: '600'
            }}>
              Page {pagination.page} <span style={{ margin: '0 0.375rem', opacity: 0.5 }}>of</span> {pagination.totalPages}
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              style={{
                padding: '0.5rem',
                border: '1px solid rgba(196, 183, 91, 0.3)',
                borderRadius: '0.5rem',
                background: pagination.page >= pagination.totalPages ? 'rgba(0,0,0,0.02)' : 'white',
                color: pagination.page >= pagination.totalPages ? 'var(--muted-jade)' : 'var(--imperial-emerald)',
                cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

