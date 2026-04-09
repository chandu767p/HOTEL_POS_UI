import React, { useState, useEffect } from 'react';
import { debounce } from '../../utils/helpers';

export default function FilterBar({ filters, onChange, fields }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounce search input
  const debouncedChange = React.useMemo(
    () => debounce((val) => onChange({ ...filters, search: val, page: 1 }), 350),
    [filters, onChange]
  );

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const handleSearch = (val) => {
    setLocalSearch(val);
    debouncedChange(val);
  };

  const handleField = (key, val) => {
    onChange({ ...filters, [key]: val, page: 1 });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== 'page' && k !== 'limit' && k !== 'sortField' && k !== 'sortOrder' && v
  );

  const clearAll = () => {
    setLocalSearch('');
    const cleared = { page: 1, limit: filters.limit, sortField: filters.sortField, sortOrder: filters.sortOrder };
    onChange(cleared);
  };

  return (
    <div className="card p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="form-input pl-9 pr-4"
          />
          {localSearch && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Dynamic filter fields */}
        {fields?.map((field) => (
          <div key={field.key} className="min-w-[140px]">
            {field.type === 'select' ? (
              <select
                value={filters[field.key] || ''}
                onChange={(e) => handleField(field.key, e.target.value)}
                className="form-input"
              >
                <option value="">{field.placeholder || `All ${field.label}`}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                value={filters[field.key] || ''}
                onChange={(e) => handleField(field.key, e.target.value)}
                placeholder={field.placeholder || field.label}
                className="form-input"
              />
            )}
          </div>
        ))}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button onClick={clearAll} className="btn-secondary btn-sm text-red-500 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
