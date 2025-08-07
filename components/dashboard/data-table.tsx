'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string | ReactNode;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T>({ 
  data, 
  columns, 
  className = '', 
  onRowClick,
  loading = false,
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortKey === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = (a as any)[sortKey];
    const bValue = (b as any)[sortKey];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  if (loading) {
    return (
      <div className={`dashboard-card ${className}`}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="dashboard-skeleton h-12" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="dashboard-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-[var(--dashboard-hover)]' : ''}`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key as string)}
              >
                <div className="flex items-center justify-between">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <div className="ml-2">
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="dashboard-icon-sm" />
                        ) : sortDirection === 'desc' ? (
                          <ChevronDown className="dashboard-icon-sm" />
                        ) : (
                          <ArrowUpDown className="dashboard-icon-sm text-[var(--dashboard-text-muted)]" />
                        )
                      ) : (
                        <ArrowUpDown className="dashboard-icon-sm text-[var(--dashboard-text-muted)]" />
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-[var(--dashboard-text-muted)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item, index) => (
              <tr
                key={index}
                className={onRowClick ? 'cursor-pointer' : ''}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={column.className || ''}>
                    {column.render 
                      ? column.render(item, index)
                      : String((item as any)[column.key] || '')
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}