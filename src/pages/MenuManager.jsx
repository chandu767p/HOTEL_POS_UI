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
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '', category: '', kitchen: '', isAvailable: true, isBundle: false, bundleItems: [] });
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
    setItemForm({
      name: '',
      price: '',
      description: '',
      category: categories[0]?._id || '',
      kitchen: '',
      isAvailable: true,
      isBundle: false,
      bundleItems: [],
      dietary: 'none'
    });
    setItemModal({ open: true, editing: null });
  };
  const openAddCombo = () => {
    setItemForm({
      name: '',
      price: '',
      description: '',
      category: selectedCategoryId !== 'all' ? selectedCategoryId : (categories[0]?._id || ''),
      kitchen: '',
      isAvailable: true,
      isBundle: true,
      bundleItems: [],
      dietary: 'none'
    });
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
      isBundle: item.isBundle || false,
      bundleItems: item.bundleItems ? item.bundleItems.map(bi => ({ item: bi.item?._id || bi.item, quantity: bi.quantity })) : [],
      dietary: item.dietary || 'none'
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
        <div className="flex gap-2">
          <button onClick={openAddCat} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all">
            + Category
          </button>
          <button onClick={openAddItem} className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all shadow-lg shadow-slate-200">
            + Item
          </button>
          <button onClick={openAddCombo} className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
            <span>⚡</span> Combo
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
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-[12px] font-bold tracking-tight transition-all pr-20
                        ${selectedCategoryId === cat._id
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{cat.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedCategoryId === cat._id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {displayedItems.map(item => (
                <div
                  key={item._id}
                  className={`relative group bg-white border border-slate-100 rounded-3xl p-5 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300
                    ${item.isAvailable === false ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className="flex gap-5">
                    {/* Visual Indicator Layer */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-800 font-black text-xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Dietary Tag - Floating mini */}
                      <div className="absolute -top-1 -right-1">
                        {item.dietary === 'veg' && (
                          <div className="w-5 h-5 bg-white border border-emerald-500 p-[2px] rounded-md shadow-sm">
                             <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                          </div>
                        )}
                        {item.dietary === 'non-veg' && (
                          <div className="w-5 h-5 bg-white border border-rose-500 p-[2px] rounded-md shadow-sm">
                             <div className="w-full h-full bg-rose-500 rounded-full"></div>
                          </div>
                        )}
                        {item.dietary === 'egg' && (
                          <div className="w-5 h-5 bg-white border border-amber-500 p-[2px] rounded-md shadow-sm">
                             <div className="w-full h-full bg-amber-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Layer */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-3 mb-1">
                          <h3 className="text-slate-900 font-black text-[15px] tracking-tight truncate group-hover:text-blue-600 transition-colors uppercase">
                            {item.name}
                          </h3>
                          <span className="text-slate-900 font-black text-lg tracking-tighter">${item.price.toFixed(2)}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] font-bold leading-tight line-clamp-1 mb-3">
                          {item.description || 'Premium menu item crafted with fresh ingredients.'}
                        </p>
                        
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-md">
                            {item.category?.name}
                          </span>
                          {item.isBundle && (
                             <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md">
                               Combo • {item.bundleItems?.length || 0} Parts
                             </span>
                          )}
                          {item.kitchen && (() => {
                            const k = kitchens.find(k => k._id === (item.kitchen?._id || item.kitchen));
                            return k ? (
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-slate-100 text-white rounded-md shadow-sm" style={{ backgroundColor: k.displayColor }}>
                                {k.name}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      {/* Expanded Info for Combos */}
                      {item.isBundle && item.bundleItems?.length > 0 && (
                        <div className="mb-4 bg-slate-50/50 rounded-2xl p-3 border border-slate-100 border-dashed">
                           <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {item.bundleItems.map((bi, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50"></div>
                                   <span className="text-[10px] font-bold text-slate-500">{bi.item?.name} <span className="text-slate-300">x{bi.quantity}</span></span>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Actions Layer */}
                      <div className="flex items-center justify-between mt-auto">
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                            ${item.isAvailable !== false
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white'
                              : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-200 hover:text-slate-600'}`}
                        >
                          <div className={`w-1 h-1 rounded-full ${item.isAvailable !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          {item.isAvailable !== false ? 'Active' : 'Hidden'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditItem(item)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-300 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-300 hover:text-rose-600 border border-rose-50 hover:border-rose-100 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
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

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Dietary Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['none', 'veg', 'non-veg', 'egg'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setItemForm(p => ({ ...p, dietary: type }))}
                    className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
                      ${itemForm.dietary === type 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                        : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                  >
                    {type === 'none' ? 'General' : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl h-[58px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Is this a Combo?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isBundle}
                    onChange={e => setItemForm(p => ({ ...p, isBundle: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:bg-white peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>

            {itemForm.isBundle && (
              <div className="sm:col-span-2 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <label className="form-label">Combo Components</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {items.filter(i => !i.isBundle && i._id !== itemModal.editing?._id).map(i => {
                    const isSelected = itemForm.bundleItems.some(bi => bi.item === i._id);
                    return (
                      <button
                        key={i._id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setItemForm(p => ({ ...p, bundleItems: p.bundleItems.filter(bi => bi.item !== i._id) }));
                          } else {
                            setItemForm(p => ({ ...p, bundleItems: [...p.bundleItems, { item: i._id, quantity: 1 }] }));
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all
                          ${isSelected ? 'bg-white border-brand-primary text-brand-primary shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        <span className="truncate flex-1 text-left">{i.name}</span>
                        {isSelected && (
                          <div className="flex items-center gap-2 ml-2">
                            <input
                              type="number"
                              min="1"
                              className="w-10 h-6 bg-slate-100 border-0 rounded text-center text-[10px]"
                              value={itemForm.bundleItems.find(bi => bi.item === i._id)?.quantity || 1}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setItemForm(p => ({ ...p, bundleItems: p.bundleItems.map(bi => bi.item === i._id ? { ...bi, quantity: val } : bi) }));
                              }}
                            />
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
