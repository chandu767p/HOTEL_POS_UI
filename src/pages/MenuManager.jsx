import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  // Modal states
  const [catModal, setCatModal] = useState({ open: false, editing: null });
  const [itemModal, setItemModal] = useState({ open: false, editing: null });

  // Forms
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '', category: '', kitchen: '', isAvailable: true });
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [menuRes, kitchensRes] = await Promise.all([
        api.get('/menu'),
        api.get('/kitchens'),
      ]);
      setCategories(menuRes.data.categories);
      setItems(menuRes.data.items);
      setKitchens(kitchensRes.data.data || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Category CRUD
  const openAddCat = () => {
    setCatForm({ name: '', description: '' });
    setCatModal({ open: true, editing: null });
  };
  const openEditCat = (cat) => {
    setCatForm({ name: cat.name, description: cat.description || '' });
    setCatModal({ open: true, editing: cat });
  };
  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return addToast('Category name is required', 'warning');
    setSubmitting(true);
    try {
      if (catModal.editing) {
        await api.put(`/menu/categories/${catModal.editing._id}`, catForm);
        addToast('Category updated', 'success');
      } else {
        await api.post('/menu/categories', catForm);
        addToast('Category added', 'success');
      }
      setCatModal({ open: false, editing: null });
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteCat = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This will remove all items in it if confirmed.`)) return;
    try {
      await api.delete(`/menu/categories/${cat._id}`);
      addToast('Category deleted', 'success');
      if (selectedCategoryId === cat._id) setSelectedCategoryId('all');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Item CRUD
  const openAddItem = () => {
    setItemForm({ name: '', price: '', description: '', category: categories[0]?._id || '', kitchen: '', isAvailable: true });
    setItemModal({ open: true, editing: null });
  };
  const openEditItem = (item) => {
    setItemForm({
      name: item.name,
      price: item.price,
      description: item.description || '',
      category: item.category?._id || item.category || '',
      kitchen: item.kitchen?._id || item.kitchen || '',
      isAvailable: item.isAvailable !== false,
    });
    setItemModal({ open: true, editing: item });
  };
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return addToast('Item name is required', 'warning');
    if (!itemForm.price || isNaN(itemForm.price)) return addToast('Valid price is required', 'warning');
    if (!itemForm.category) return addToast('Category is required', 'warning');
    setSubmitting(true);
    try {
      if (itemModal.editing) {
        await api.put(`/menu/items/${itemModal.editing._id}`, itemForm);
        addToast('Item updated', 'success');
      } else {
        await api.post('/menu/items', itemForm);
        addToast('Item added', 'success');
      }
      setItemModal({ open: false, editing: null });
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete item "${item.name}" from the menu?`)) return;
    try {
      await api.delete(`/menu/items/${item._id}`);
      addToast('Item deleted', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };
  const handleToggleAvailable = async (item) => {
    try {
      await api.put(`/menu/items/${item._id}`, { isAvailable: !item.isAvailable });
      addToast(`${item.name} state changed to ${!item.isAvailable ? 'Available' : 'Unavailable'}`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const displayedItems = selectedCategoryId === 'all'
    ? items
    : items.filter(i => i.category?._id === selectedCategoryId);

  if (loading) return (
    <div className="flex items-center justify-center p-32">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Menu Tools</h1>
          <p className="text-slate-400 text-sm mt-3 font-semibold uppercase tracking-wider">{items.length} items across {categories.length} categories</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openAddCat} className="btn-secondary px-6 text-xs uppercase tracking-widest font-bold">
            New Category
          </button>
          <button onClick={openAddItem} className="btn-primary px-6 text-xs uppercase tracking-widest font-bold">
            New Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
        {/* Categories Sidebar */}
        <div className="space-y-6">
          <div>
            <label className="form-label mb-4 block">Categories</label>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`w-full text-left px-5 py-4 rounded-xl text-[13px] font-bold tracking-tight transition-all
                    ${selectedCategoryId === 'all'
                    ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}
              >
                <div className="flex items-center justify-between">
                  <span>All Items</span>
                  <span className={`text-[11px] font-black ${selectedCategoryId === 'all' ? 'text-white/60' : 'text-slate-300'}`}>{items.length}</span>
                </div>
              </button>

              {categories.map(cat => (
                <div key={cat._id} className="group relative">
                  <button
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={`w-full text-left px-5 py-4 rounded-xl text-[13px] font-bold tracking-tight transition-all pr-24
                        ${selectedCategoryId === cat._id
                        ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{cat.name}</span>
                      <span className={`text-[11px] font-black ${selectedCategoryId === cat._id ? 'text-white/60' : 'text-slate-300'}`}>
                        {items.filter(i => i.category?._id === cat._id).length}
                      </span>
                    </div>
                  </button>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat); }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Master Registry Grid */}
        <div>
          {displayedItems.length === 0 ? (
            <div className="py-40 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No items in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedItems.map(item => (
                <div
                  key={item._id}
                  className={`card p-8 group transition-all duration-300 relative
                    ${item.isAvailable === false ? 'opacity-40 grayscale' : 'hover:border-slate-300'}`}
                >
                  <div className="flex gap-6">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl shrink-0 flex items-center justify-center text-brand-primary font-black text-2xl group-hover:bg-brand-primary/5 transition-colors">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-900 font-bold text-lg tracking-tight truncate pr-4 group-hover:text-brand-primary transition-colors">{item.name}</h3>
                        <span className="text-brand-primary font-black text-xl leading-none">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-slate-500 text-[13px] font-semibold leading-relaxed line-clamp-2 mb-4 h-9">
                        {item.description || 'No description available for this item.'}
                      </p>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge bg-slate-100 text-slate-500 border border-slate-200 py-1 px-3">
                          {item.category?.name}
                        </span>
                        {item.kitchen && (() => {
                          const k = kitchens.find(k => k._id === (item.kitchen?._id || item.kitchen));
                          return k ? (
                            <span className="badge py-1 px-3 border border-slate-200 text-white shadow-sm" style={{ backgroundColor: k.displayColor }}>
                              {k.name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border
                        ${item.isAvailable !== false
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white'
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-200 hover:text-slate-600'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${item.isAvailable !== false ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                      {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </button>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditItem(item)}
                        className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-200 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 hover:border-rose-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <Modal isOpen={catModal.open} onClose={() => setCatModal({ open: false, editing: null })} title={catModal.editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSaveCat} className="space-y-8 pt-4">
          <div className="space-y-2">
            <label className="form-label">Category Name *</label>
            <input
              className="form-input"
              value={catForm.name}
              onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Mains"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input min-h-[100px] py-4"
              value={catForm.description}
              onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description..."
            />
          </div>
          <button disabled={submitting} type="submit" className="btn-primary w-full py-5 text-[12px] uppercase tracking-[0.2em]">
            {submitting ? 'Saving...' : catModal.editing ? 'Save Category' : 'Add Category'}
          </button>
        </form>
      </Modal>

      {/* Item Modal */}
      <Modal isOpen={itemModal.open} onClose={() => setItemModal({ open: false, editing: null })} title={itemModal.editing ? 'Edit Item' : 'Add Item'} size="md">
        <form onSubmit={handleSaveItem} className="space-y-8 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="sm:col-span-2 space-y-2">
              <label className="form-label">Item Name *</label>
              <input
                className="form-input"
                value={itemForm.name}
                onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Hamburger"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="form-label">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={itemForm.price}
                onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="form-label">Category *</label>
              <select
                className="form-input"
                value={itemForm.category}
                onChange={e => setItemForm(p => ({ ...p, category: e.target.value }))}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="form-label">Kitchen Station</label>
              <select
                className="form-input"
                value={itemForm.kitchen}
                onChange={e => setItemForm(p => ({ ...p, kitchen: e.target.value }))}
              >
                <option value="">None</option>
                {kitchens.map(k => (
                  <option key={k._id} value={k._id}>{k.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl h-[58px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available to Order</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isAvailable}
                    onChange={e => setItemForm(p => ({ ...p, isAvailable: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:bg-white peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-input min-h-[120px] py-4"
                value={itemForm.description}
                onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Item details..."
              />
            </div>
          </div>

          <button disabled={submitting} type="submit" className="btn-primary w-full py-5 text-[12px] uppercase tracking-[0.2em]">
            {submitting ? 'Saving...' : itemModal.editing ? 'Save Item' : 'Add Item'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
