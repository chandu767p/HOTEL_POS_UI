import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Kitchens() {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'general', displayColor: '#3B82F6' });
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const fetchKitchens = useCallback(async () => {
    try {
      const res = await api.get('/kitchens');
      setKitchens(res.data.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchKitchens(); }, [fetchKitchens]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return addToast('Kitchen name is required', 'warning');
    setSubmitting(true);
    try {
      await api.post('/kitchens', formData);
      addToast(`Kitchen "${formData.name}" added`, 'success');
      setFormData({ name: '', type: 'general', displayColor: '#3B82F6' });
      setIsModalOpen(false);
      fetchKitchens();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (kitchen) => {
    if (!window.confirm(`Remove kitchen station "${kitchen.name}"?`)) return;
    try {
      await api.delete(`/kitchens/${kitchen._id}`);
      addToast(`Kitchen "${kitchen.name}" removed`, 'success');
      fetchKitchens();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh] bg-background">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Kitchen Stations</h1>
          <p className="text-text-muted text-xs mt-1">{kitchens.length} active stations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          Add Station
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kitchens.map((kitchen) => (
          <div key={kitchen._id} className="card group transition-none">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-12 h-12 rounded flex items-center justify-center text-white text-xl font-bold transition-none"
                  style={{ backgroundColor: kitchen.displayColor || '#3B82F6' }}
                >
                  {kitchen.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => handleDelete(kitchen)}
                  className="p-1.5 rounded text-text-muted hover:text-brand-danger hover:bg-background  transition-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <h3 className="text-lg font-bold text-text-primary tracking-tight group-hover:text-brand-primary transition-none uppercase">{kitchen.name}</h3>
              <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mt-0.5">{kitchen.type} station</p>
            </div>

            <div className="px-6 py-4 bg-background/30 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-success"></div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                  Online
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-muted/50 uppercase">{kitchen.displayColor}</span>
            </div>
          </div>
        ))}

        {kitchens.length === 0 && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-text-muted font-semibold uppercase tracking-widest text-xs">No kitchen stations defined</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Station">
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="form-label">Station Name</label>
              <input
                className="form-input"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Station ID"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
              >
                <option value="general">General</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Veg</option>
                <option value="bar">Bar</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="form-label">Color Coding</label>
            <div className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4">
              <input
                type="color"
                className="w-12 h-12 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                value={formData.displayColor}
                onChange={e => setFormData(p => ({ ...p, displayColor: e.target.value }))}
              />
              <div>
                <p className="text-text-primary font-mono text-base font-bold uppercase tracking-tight">{formData.displayColor}</p>
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Hex Signature</p>
              </div>
            </div>
          </div>

          <button disabled={submitting} type="submit" className="btn-primary w-full py-3 text-xs uppercase tracking-widest">
            {submitting ? 'Registering...' : 'Add Station'}
          </button>
        </form>
      </Modal>
    </div>
  );
}