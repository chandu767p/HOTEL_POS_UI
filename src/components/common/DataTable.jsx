import React, { useState, useRef, useCallback } from 'react';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({
  columns: initialColumns,
  data,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
  onSort,
  sortField,
  sortOrder,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onBulkDelete,
  toolbar,
  emptyMessage = 'No records found',
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [showColMenu, setShowColMenu] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragColIdx = useRef(null);
  const colMenuRef = useRef(null);

  // Sync columns when initialColumns changes (e.g. page switches)
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [JSON.stringify(initialColumns.map((c) => c.key))]);

  // Close col menu on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) {
        setShowColMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleColumns = columns.filter((c) => !c.hidden);

  const toggleColumn = (key) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, hidden: !c.hidden } : c))
    );
  };

  // Drag-to-reorder columns
  const handleDragStart = (e, idx) => {
    dragColIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragColIdx.current;
    if (from === null || from === idx) return;

    setColumns((prev) => {
      const visible = prev.filter((c) => !c.hidden);
      const hidden = prev.filter((c) => c.hidden);
      const reordered = [...visible];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(idx, 0, moved);
      return [...reordered, ...hidden];
    });

    dragColIdx.current = null;
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragColIdx.current = null;
    setDragOverIdx(null);
  };

  const handleSort = (col) => {
    if (!col.sortable) return;
    const newOrder = sortField === col.key && sortOrder === 'desc' ? 'asc' : 'desc';
    onSort(col.key, newOrder);
  };

  const allSelected =
    data.length > 0 && data.every((row) => selectedIds.includes(row._id));
  const someSelected = selectedIds.length > 0;

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      {(toolbar || someSelected) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            {someSelected && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {selectedIds.length} selected
                </span>
                <button onClick={onBulkDelete} className="btn-danger btn-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Selected
                </button>
              </div>
            )}
            {toolbar}
          </div>

          {/* Column visibility */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setShowColMenu((v) => !v)}
              className="btn-secondary btn-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Columns
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-2">
                <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Show / Hide Columns
                </p>
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={!col.hidden}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {/* Checkbox */}
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>

              {visibleColumns.map((col, idx) => (
                <th
                  key={col.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSort(col)}
                  className={`
                    px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap select-none
                    ${col.sortable ? 'cursor-pointer hover:text-gray-900 hover:bg-gray-100' : ''}
                    ${dragOverIdx === idx ? 'bg-blue-50 border-l-2 border-blue-400' : ''}
                    transition-colors
                  `}
                  style={{ minWidth: col.minWidth || 100 }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      title="Drag to reorder"
                      className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                    >
                      ⋮⋮
                    </span>
                    {col.label}
                    {col.sortable && (
                      <span className="ml-auto">
                        {sortField === col.key ? (
                          sortOrder === 'asc' ? (
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              <th className="px-4 py-3 text-right font-semibold text-gray-600 w-24">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row._id}
                  className={`hover:bg-blue-50/30 transition-colors ${
                    selectedIds.includes(row._id) ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row._id)}
                      onChange={() => onSelectRow(row._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row) : (
                        <span className="truncate max-w-xs block">
                          {getNestedValue(row, col.key) ?? '—'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {row._actions}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}
