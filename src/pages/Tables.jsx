import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ number: '', capacity: 4 });
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchTables = useCallback(async () => {
    try {
      const res = await api.get('/tables');
      const sorted = res.data.sort((a, b) => 
        a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
      );
      setTables(sorted);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!tableForm.number) return addToast('Table number is required', 'warning');
    setSubmitting(true);
    try {
      await api.post('/tables', tableForm);
      addToast(`Table ${tableForm.number} indexed`, 'success');
      setTableForm({ number: '', capacity: 4 });
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (table) => {
    if (table.status === 'occupied') {
      return addToast('Cannot delete an occupied table — settle the order first', 'warning');
    }
    if (!window.confirm(`Remove Table ${table.number} from the floor plan?`)) return;
    try {
      await api.delete(`/tables/${table._id}`);
      addToast(`Table ${table.number} removed`, 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleTableClick = (table) => {
    navigate(`/order/${table._id}`);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'available': return {
        badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
        card: 'hover:border-emerald-200'
      };
      case 'occupied': return {
        badge: 'bg-rose-50 text-rose-600 border-rose-100',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
        card: 'border-rose-100 bg-rose-50/30 hover:border-rose-200'
      };
      case 'reserved': return {
        badge: 'bg-amber-50 text-amber-600 border-amber-100',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        card: 'border-amber-100'
      };
      default: return { badge: 'bg-slate-50 text-slate-400 border-slate-100', dot: 'bg-slate-200', card: '' };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-32">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin"></div>
    </div>
  );

  const available = tables.filter(t => t.status === 'available').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="max-w-[1600px] mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Table Layout</h1>
          <div className="flex items-center gap-6 mt-4">
            <span className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              {available} Available
            </span>
            <span className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-rose-600">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              {occupied} Occupied
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              {tables.length} Total
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchTables} className="btn-secondary p-3.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-4 px-8 text-xs uppercase tracking-widest"
          >
            Initialize Table
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {tables.map((table) => {
          const styles = getStatusStyles(table.status);
          return (
            <div
              key={table._id}
              className={`group card p-8 transition-all duration-300 relative cursor-pointer active:scale-95 ${styles.card}`}
              onClick={() => handleTableClick(table)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTable(table); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 transition-all duration-500
                ${table.status === 'occupied'
                  ? 'bg-rose-100 text-rose-600 border border-rose-200 shadow-sm'
                  : 'bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary group-hover:shadow-lg group-hover:shadow-brand-primary/20'}`}>
                {table.number}
              </div>

              <div className="mb-4">
                <div className={`badge py-1 px-3 border ${styles.badge}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${styles.dot} mr-2`}></div>
                  {table.status}
                </div>
              </div>

              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{table.capacity} Capacity</p>

              <div className={`mt-6 pt-5 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest transition-colors
                ${table.status === 'occupied' ? 'text-rose-500' : 'text-slate-400 group-hover:text-brand-primary'}`}>
                {table.status === 'occupied' ? 'View Order →' : 'Open Session →'}
              </div>
            </div>
          );
        })}

        {tables.length === 0 && (
          <div className="col-span-full py-40 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Add your first table →</p>
          </div>
        )}
      </div>

      {/* Initialize Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize Grid Node">
        <form onSubmit={handleCreateTable} className="space-y-8 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="form-label">Table Identity *</label>
              <input
                className="form-input"
                value={tableForm.number}
                onChange={e => setTableForm(p => ({ ...p, number: e.target.value }))}
                placeholder="e.g. T-01"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="form-label">Occupancy Capacity</label>
              <input
                type="number"
                min="1"
                max="50"
                className="form-input"
                value={tableForm.capacity}
                onChange={e => setTableForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <button disabled={submitting} type="submit" className="btn-primary w-full py-5 text-[12px] uppercase tracking-[0.2em]">
            {submitting ? 'Initializing...' : 'Authorize Node Entry'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
