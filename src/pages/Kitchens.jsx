import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function Kitchens() {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'general', displayColor: '#6366f1' });
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
  }, []);

  useEffect(() => { fetchKitchens(); }, [fetchKitchens]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return addToast('Kitchen name is required', 'warning');
    setSubmitting(true);
    try {
      await api.post('/kitchens', formData);
      addToast(`Kitchen ${formData.name} created`, 'success');
      setFormData({ name: '', type: 'general', displayColor: '#6366f1' });
      setIsModalOpen(false);
      fetchKitchens();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (kitchen) => {
    if (!window.confirm(`Delete the Kitchen ${kitchen.name}?`)) return;
    try {
      await api.delete(`/kitchens/${kitchen._id}`);
      addToast(`Kitchen ${kitchen.name} removed`, 'success');
      fetchKitchens();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Kitchens...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col flex-wrap sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Kitchens</h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{kitchens.length} Active Stations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 uppercase tracking-widest self-start sm:self-center"
        >
          + Add Kitchen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kitchens.map((kitchen) => (
          <div key={kitchen._id} className="relative bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group">
            
            <button
              onClick={() => handleDelete(kitchen)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <div className="flex gap-4 items-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md" style={{ backgroundColor: kitchen.displayColor || '#6366f1' }}>
                {kitchen.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900 text-xl tracking-tight leading-tight">{kitchen.name}</h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-black uppercase tracking-widest">
                  {kitchen.type}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${kitchen.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
               <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                 {kitchen.isActive ? 'Active' : 'Inactive'}
               </span>
            </div>
          </div>
        ))}

        {kitchens.length === 0 && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-100 rounded-3xl bg-white">
            <div className="text-5xl mb-4">👨‍🍳</div>
            <p className="text-gray-400 font-bold text-lg mb-2">No kitchens configured yet</p>
            <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-black text-sm hover:text-indigo-800 uppercase tracking-widest">
              Add your first kitchen →
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Kitchen Station">
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kitchen Name *</label>
            <input
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Master Grill"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Station Type</label>
            <select
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50"
              value={formData.type}
              onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
            >
              <option value="general">General</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="bar">Bar / Drinks</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Display Color</label>
            <input
              type="color"
              className="w-full h-14 bg-gray-50 border-2 border-gray-100 rounded-2xl p-1 cursor-pointer"
              value={formData.displayColor}
              onChange={e => setFormData(p => ({ ...p, displayColor: e.target.value }))}
            />
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 mt-2">
            {submitting ? 'Creating...' : 'Create Kitchen'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
