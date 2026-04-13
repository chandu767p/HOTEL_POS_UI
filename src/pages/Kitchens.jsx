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
    <div className="flex items-center justify-center p-32">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Kitchens</h1>
          <p className="text-slate-400 text-sm mt-3 font-semibold uppercase tracking-wider">{kitchens.length} kitchen stations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-4 px-8 text-xs font-bold uppercase tracking-widest"
        >
          Add Kitchen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kitchens.map((kitchen) => (
          <div key={kitchen._id} className="card group hover:border-slate-300 transition-all cursor-default overflow-hidden shadow-xl shadow-slate-200/20">
            <div className="p-8 pb-6">
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: kitchen.displayColor || '#3B82F6' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                  {kitchen.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => handleDelete(kitchen)}
                  className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 hover:border-rose-100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1 group-hover:text-brand-primary transition-colors">{kitchen.name}</h3>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{kitchen.type} station</p>
            </div>

            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${kitchen._id ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}></div>
                <span className="text-[11px] uppercase font-black tracking-widest text-slate-400">
                  Operational
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            </div>
          </div>
        ))}

        {kitchens.length === 0 && (
          <div className="col-span-full py-40 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No kitchens added yet</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Kitchen">
        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="form-label">Kitchen Name *</label>
              <input
                className="form-input"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Main Kitchen"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="form-label">Kitchen Type</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
              >
                <option value="general">General</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="bar">Bar</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="form-label">Display Colour</label>
            <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-xl p-6">
              <input
                type="color"
                className="w-16 h-16 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden shadow-xl"
                value={formData.displayColor}
                onChange={e => setFormData(p => ({ ...p, displayColor: e.target.value }))}
              />
              <div className="flex-1">
                <p className="text-slate-900 font-mono text-sm font-bold uppercase tracking-wide mb-1.5">{formData.displayColor}</p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Kitchen colour identifier</p>
              </div>
            </div>
          </div>

          <button disabled={submitting} type="submit" className="btn-primary w-full py-5 text-[12px] uppercase tracking-[0.2em]">
            {submitting ? 'Adding...' : 'Add Kitchen'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

