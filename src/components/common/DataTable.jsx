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
        <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-6  bg-dark-850/50 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-wrap">
            {someSelected && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-white bg-brand-primary/20 border border-brand-primary/20 px-4 py-1.5 rounded-lg shadow-sm">
                  {selectedIds.length} Selected
                </span>
                <button onClick={onBulkDelete} className="btn-danger btn-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
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
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              View
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-full mt-3 w-56 bg-dark-800 border border-white-[0.1] rounded-xl shadow-2xl z-20 py-3 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <p className="px-5 pb-3 text-[10px] font-bold text-brand-secondary uppercase tracking-widest  mb-2">
                  Display Options
                </p>
                <div className="max-h-64 overflow-y-auto px-2">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white-[0.05] rounded-lg cursor-pointer text-[13px] font-medium text-brand-secondary hover:text-white transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={!col.hidden}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-white-[0.1] bg-dark-900 text-brand-primary focus:ring-brand-primary/20"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-dark-900/50 ">
              {/* Checkbox */}
              <th className="w-12 px-8 py-6">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-white-[0.1] bg-dark-900 text-brand-primary focus:ring-brand-primary/20 w-4 h-4"
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
                    px-8 py-6 text-left font-semibold text-brand-secondary uppercase tracking-wider text-[11px] select-none
                    ${col.sortable ? 'cursor-pointer hover:text-white hover:bg-white-[0.02]' : ''}
                    ${dragOverIdx === idx ? 'bg-brand-primary/5 border-l-2 border-brand-primary/30' : ''}
                    transition-all
                  `}
                  style={{ minWidth: col.minWidth || 120 }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      title="Drag to reorder"
                      className="text-white/10 group-hover:text-white/30 cursor-grab active:cursor-grabbing text-xs"
                    >
                      ⋮⋮
                    </span>
                    {col.label}
                    {col.sortable && (
                      <span className="ml-auto opacity-30">
                        {sortField === col.key ? (
                          sortOrder === 'asc' ? (
                            <svg className="w-3.5 h-3.5 text-brand-primary opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-brand-primary opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              <th className="px-8 py-6 text-right font-semibold text-brand-secondary uppercase tracking-wider text-[11px] w-32">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white-[0.05]">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-brand-secondary">
                    <LoadingSpinner size="lg" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">Syncing Node Logs...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-32 text-center">
                  <div className="flex flex-col items-center gap-4 text-brand-secondary">
                    <div className="w-20 h-20 rounded-3xl bg-white-[0.02]  flex items-center justify-center mb-2">
                      <svg className="w-10 h-10 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium opacity-50 tracking-tight">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row._id}
                  className={`hover:bg-white-[0.03] transition-colors group ${selectedIds.includes(row._id) ? 'bg-brand-primary/5' : 'bg-transparent'
                    }`}
                >
                  <td className="px-8 py-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row._id)}
                      onChange={() => onSelectRow(row._id)}
                      className="rounded border-white-[0.1] bg-dark-900 text-brand-primary focus:ring-brand-primary/20 w-4 h-4"
                    />
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-8 py-6 text-brand-secondary font-normal group-hover:text-white transition-colors">
                      {col.render ? col.render(row) : (
                        <span className="truncate max-w-sm block">
                          {getNestedValue(row, col.key) ?? '—'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
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
        <div className="px-8 py-6 border-t border-white-[0.05] bg-dark-900/50">
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </div>
      )}
    </div>
  );
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}
