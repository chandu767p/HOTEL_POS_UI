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
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-surface border-b border-border">
          <div className="flex items-center gap-4 flex-wrap">
            {someSelected && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded">
                  {selectedIds.length} Selected
                </span>
                <button onClick={onBulkDelete} className="btn-danger py-1 px-3 text-[10px]">
                  Delete Records
                </button>
              </div>
            )}
            {toolbar}
          </div>

          {/* Column visibility */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setShowColMenu((v) => !v)}
              className="btn-secondary py-1.5 px-3 text-[10px] uppercase tracking-wider"
            >
              Columns
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded shadow-xl z-20 py-2 transition-none">
                <p className="px-4 pb-2 text-[9px] font-bold text-text-muted uppercase tracking-widest border-b border-border mb-2">
                  Visibility
                </p>
                <div className="max-h-60 overflow-y-auto px-1">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-3 px-3 py-1.5 hover:bg-background rounded cursor-pointer text-xs font-medium text-text-muted hover:text-text-primary transition-none"
                    >
                      <input
                        type="checkbox"
                        checked={!col.hidden}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-border bg-background text-brand-primary focus:ring-0 focus:ring-offset-0"
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
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-background">
              {/* Checkbox */}
              <th className="w-10 px-6 py-4 border-b border-border">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-border bg-surface text-brand-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
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
                    px-6 py-4 text-left font-bold text-text-muted uppercase tracking-wider text-[10px] select-none border-b border-border
                    ${col.sortable ? 'cursor-pointer hover:text-text-primary hover:bg-surface' : ''}
                    ${dragOverIdx === idx ? 'bg-brand-primary/5 border-l-2 border-brand-primary' : ''}
                    transition-none
                  `}
                  style={{ minWidth: col.minWidth || 120 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-border cursor-grab active:cursor-grabbing text-[10px]">⋮⋮</span>
                    {col.label}
                    {col.sortable && (
                      <span className="ml-auto opacity-50">
                        {sortField === col.key ? (
                          sortOrder === 'asc' ? (
                            <svg className="w-3 h-3 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              <th className="px-6 py-4 text-right font-bold text-text-muted uppercase tracking-wider text-[10px] w-28 border-b border-border">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <LoadingSpinner />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Loading Node Records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-muted">
                    <div className="w-12 h-12 rounded bg-background flex items-center justify-center border border-border">
                      <svg className="w-6 h-6 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold tracking-tight uppercase">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row._id}
                  className={`hover:bg-surface transition-none group ${selectedIds.includes(row._id) ? 'bg-brand-primary/5' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row._id)}
                      onChange={() => onSelectRow(row._id)}
                      className="rounded border-border bg-surface text-brand-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-text-primary font-medium group-hover:text-text-primary transition-none">
                      {col.render ? col.render(row) : (
                        <span className="truncate max-w-sm block">
                          {getNestedValue(row, col.key) ?? '—'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2  transition-none">
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
        <div className="px-6 py-4 bg-background border-t border-border">
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
