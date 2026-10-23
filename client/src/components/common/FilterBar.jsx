import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

const FilterBar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onClearFilters
}) => {
  return (
    <div className="card shadow-none p-3 mb-3 border bg-light">
      <div className="row g-2 align-items-center">
        {onSearchChange !== undefined && (
          <div className="col-12 col-md">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder={searchPlaceholder}
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {filters.map((filter, idx) => (
          <div key={idx} className="col-6 col-md-auto">
            <select
              className="form-select"
              value={filter.value || ''}
              onChange={(e) => filter.onChange(e.target.value)}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt, oIdx) => (
                <option key={oIdx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onClearFilters && (
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              title="Reset Filters"
              onClick={onClearFilters}
            >
              <RotateCcw size={15} />
              <span className="d-none d-sm-inline">Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
