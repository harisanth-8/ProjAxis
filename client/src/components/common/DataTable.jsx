import React, { useState } from 'react';
import Spinner from './Spinner';
import EmptyState from './EmptyState';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your query.',
  pagination,
  onPageChange
}) => {
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  if (loading) {
    return (
      <div className="card shadow-none">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  // Handle client-side sorting if applicable
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  let displayData = [...data];
  if (sortField) {
    displayData.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="card shadow-none border">
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    cursor: col.sortable ? 'pointer' : 'default',
                    width: col.width || 'auto'
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="d-flex align-items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && <ArrowUpDown size={13} className="text-muted" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, rIdx) => (
              <tr key={row._id || rIdx}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light small text-muted">
          <div>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
