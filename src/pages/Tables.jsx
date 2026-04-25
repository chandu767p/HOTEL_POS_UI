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
        badge: 'status-green',
        dot: 'bg-brand-success',
        card: 'border-transparent hover:border-brand-primary'
      };
      case 'occupied': return {
        badge: 'status-red',
        dot: 'bg-brand-danger',
        card: 'border-brand-danger/30 bg-brand-danger/5'
      };
      case 'reserved': return {
        badge: 'status-orange',
        dot: 'bg-brand-warning',
        card: 'border-brand-warning/30'
      };
      default: return { badge: 'bg-border/50 text-text-muted', dot: 'bg-text-muted', card: '' };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh] bg-background">
      <LoadingSpinner />
    </div>
  );

  const available = tables.filter(t => t.status === 'available').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Tables</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-success uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-success"></div>
              {available} Available
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-danger uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-danger"></div>
              {occupied} Occupied
            </span>
            <span className="text-[11px] font-semibold text-text-muted uppercase">
              {tables.length} Total
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTables} className="btn-secondary p-2.5 rounded-lg group">
            <svg className="w-4 h-4 text-text-muted group-hover:text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/order/walkin')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-primary hover:text-white transition-none text-xs font-bold uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Walk-in Order
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            Add Table
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
              className={`group card  border-white text-white p-6 transition-none relative cursor-pointer ${styles.card}`}
              onClick={() => handleTableClick(table)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTable(table); }}
                className="absolute top-2 right-2 p-1.5 rounded text-text-muted hover:text-brand-danger hover:bg-background  transition-none z-10"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold mb-5 transition-none
                ${table.status === 'occupied'
                  ? 'bg-brand-danger text-white'
                  : 'bg-background text-text-muted border border-border group-hover:border-brand-primary group-hover:text-brand-primary'}`}>
                {table.number}
              </div>

              <div className="mb-3">
                <span className={`badge ${styles.badge} text-[10px]`}>
                  {table.status}
                </span>
              </div>

              <p className="text-text-muted text-[11px] font-medium uppercase tracking-tight">{table.capacity} Capacity</p>

              <div className={`mt-5 pt-4 border-t border-border/50 text-[10px] font-bold uppercase tracking-wider transition-none
                ${table.status === 'occupied' ? 'text-brand-danger' : 'text-text-muted group-hover:text-brand-primary'}`}>
                {table.status === 'occupied' ? 'View Order →' : 'Book Table →'}
              </div>
            </div>
          );
        })}

        {tables.length === 0 && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-text-muted font-semibold uppercase tracking-widest text-xs">No tables found</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Table">
        <form onSubmit={handleCreateTable} className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="form-label">Table ID</label>
              <input
                className="form-input"
                value={tableForm.number}
                onChange={e => setTableForm(p => ({ ...p, number: e.target.value }))}
                placeholder="01"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="form-label">Capacity</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={tableForm.capacity}
                onChange={e => setTableForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <button disabled={submitting} type="submit" className="btn-primary w-full py-3 text-xs uppercase tracking-widest">
            {submitting ? 'Creating...' : 'Create Table'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
