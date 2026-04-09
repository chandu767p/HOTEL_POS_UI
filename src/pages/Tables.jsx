import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

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
      setTables(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!tableForm.number) return addToast('Table number is required', 'warning');
    setSubmitting(true);
    try {
      await api.post('/tables', tableForm);
      addToast(`Table ${tableForm.number} added`, 'success');
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
    // Both available and occupied tables navigate to the order portal
    // OrderPortal handles detecting and loading the existing order
    navigate(`/order/${table._id}`);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'available': return { badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500', card: 'hover:border-indigo-200 hover:shadow-indigo-50' };
      case 'occupied': return { badge: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500', card: 'border-rose-100 hover:border-rose-200 hover:shadow-rose-50' };
      case 'reserved': return { badge: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500', card: 'border-amber-100 hover:border-amber-200' };
      default: return { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', card: '' };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full p-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading floor plan...</p>
      </div>
    </div>
  );

  const available = tables.filter(t => t.status === 'available').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Table Layout</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {available} Available
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {occupied} Occupied
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              {tables.length} Total
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchTables} className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 uppercase tracking-widest"
          >
            + Add Table
          </button>
        </div>
      </div>

      {/* Floor Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {tables.map((table) => {
          const styles = getStatusStyles(table.status);
          return (
            <div
              key={table._id}
              className={`group relative bg-white border-2 rounded-3xl p-5 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-200 active:scale-95 ${styles.card} ${table.status === 'occupied' ? 'border-rose-100' : 'border-gray-100'}`}
              onClick={() => handleTableClick(table)}
            >
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTable(table); }}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-xl bg-white border border-gray-100 items-center justify-center text-gray-300 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-all hidden group-hover:flex z-10"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Table number */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black mb-4 transition-all
                ${table.status === 'occupied' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-700 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                {table.number}
              </div>

              {/* Status */}
              <div className="mb-3">
                <div className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-widest ${styles.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                  {table.status}
                </div>
              </div>

              {/* Capacity */}
              <p className="text-gray-500 text-xs font-bold">{table.capacity} seats</p>

              {/* Action hint */}
              <div className={`mt-4 pt-3 border-t border-gray-50 text-[10px] font-black uppercase tracking-widest transition-colors
                ${table.status === 'occupied' ? 'text-rose-500' : 'text-gray-300 group-hover:text-indigo-500'}`}>
                {table.status === 'occupied' ? 'View Order →' : 'Start Order →'}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {tables.length === 0 && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-100 rounded-3xl bg-white">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-gray-400 font-bold text-lg mb-2">No tables configured yet</p>
            <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-black text-sm hover:text-indigo-800 uppercase tracking-widest">
              Add your first table →
            </button>
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Table">
        <form onSubmit={handleCreateTable} className="space-y-5 py-2">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Table Number / Name *</label>
            <input
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
              value={tableForm.number}
              onChange={e => setTableForm(p => ({ ...p, number: e.target.value }))}
              placeholder="e.g. 11 or A1"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Seating Capacity</label>
            <input
              type="number"
              min="1"
              max="50"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
              value={tableForm.capacity}
              onChange={e => setTableForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-100">
            {submitting ? 'Adding...' : 'Add to Floor Plan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
