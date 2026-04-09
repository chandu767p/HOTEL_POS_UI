import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

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
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ——— Category CRUD ———
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
        addToast('Category created', 'success');
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
    if (!window.confirm(`Delete category "${cat.name}"? It must be empty.`)) return;
    try {
      await api.delete(`/menu/categories/${cat._id}`);
      addToast('Category deleted', 'success');
      if (selectedCategoryId === cat._id) setSelectedCategoryId('all');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // ——— Item CRUD ———
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
        addToast('Item added to menu', 'success');
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
    if (!window.confirm(`Remove "${item.name}" from the menu?`)) return;
    try {
      await api.delete(`/menu/items/${item._id}`);
      addToast('Item removed', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };
  const handleToggleAvailable = async (item) => {
    try {
      await api.put(`/menu/items/${item._id}`, { isAvailable: !item.isAvailable });
      addToast(`${item.name} ${!item.isAvailable ? 'enabled' : 'disabled'}`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const displayedItems = selectedCategoryId === 'all'
    ? items
    : items.filter(i => i.category?._id === selectedCategoryId);

  if (loading) return (
    <div className="flex items-center justify-center h-full p-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading menu...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-gray-500 font-medium mt-1">{items.length} items across {categories.length} categories</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openAddCat} className="bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
            + Category
          </button>
          <button onClick={openAddItem} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100">
            + Menu Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories */}
        <div className="lg:col-span-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">Collections</p>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                ${selectedCategoryId === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'}`}
            >
              All Items
              <span className={`float-right text-xs font-black ${selectedCategoryId === 'all' ? 'text-indigo-200' : 'text-gray-400'}`}>{items.length}</span>
            </button>

            {categories.map(cat => (
              <div key={cat._id} className="group relative">
                <button
                  onClick={() => setSelectedCategoryId(cat._id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-all pr-16
                    ${selectedCategoryId === cat._id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'}`}
                >
                  {cat.name}
                  <span className={`float-right text-xs font-black ${selectedCategoryId === cat._id ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {items.filter(i => i.category?._id === cat._id).length}
                  </span>
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditCat(cat)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 text-xs shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDeleteCat(cat)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 text-xs shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="lg:col-span-3">
          {displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border-4 border-dashed border-gray-100 rounded-3xl bg-white">
              <div className="text-4xl mb-3">🥐</div>
              <p className="text-gray-400 font-bold text-sm">No items in this category yet</p>
              <button onClick={openAddItem} className="mt-3 text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800">
                Add First Item →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedItems.map(item => (
                <div
                  key={item._id}
                  className={`bg-white border-2 rounded-3xl p-5 flex gap-4 transition-all group hover:shadow-lg
                    ${item.isAvailable === false ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-indigo-100'}`}
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl shrink-0 flex items-center justify-center text-gray-300 font-black text-xl border border-gray-100">
                    {item.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-gray-900 font-black text-base leading-tight truncate pr-2">{item.name}</h3>
                      <span className="text-indigo-600 font-black text-base shrink-0">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-1 leading-relaxed">{item.description || 'No description'}</p>
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <span className="text-[9px] bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">{item.category?.name}</span>
                      {item.kitchen && (() => { const k = kitchens.find(k => k._id === (item.kitchen?._id || item.kitchen)); return k ? <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg text-white" style={{ backgroundColor: k.displayColor }}>{k.name}</span> : null; })()}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="sr-only"></span>
                      <div className="flex gap-1.5 items-center">
                        {/* Available toggle */}
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                            ${item.isAvailable !== false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                          title={item.isAvailable !== false ? 'Mark Unavailable' : 'Mark Available'}
                        >
                          {item.isAvailable !== false ? '● Available' : '○ Sold Out'}
                        </button>
                        <button onClick={() => openEditItem(item)} className="w-7 h-7 rounded-xl bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all border border-gray-100">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteItem(item)} className="w-7 h-7 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all border border-gray-100">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
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
      <Modal isOpen={catModal.open} onClose={() => setCatModal({ open: false, editing: null })} title={catModal.editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSaveCat} className="space-y-5 py-2">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category Name *</label>
            <input
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
              value={catForm.name}
              onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Desserts"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description (optional)</label>
            <input
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
              value={catForm.description}
              onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Short description"
            />
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-100">
            {submitting ? 'Saving...' : catModal.editing ? 'Update Category' : 'Create Category'}
          </button>
        </form>
      </Modal>

      {/* Item Modal */}
      <Modal isOpen={itemModal.open} onClose={() => setItemModal({ open: false, editing: null })} title={itemModal.editing ? 'Edit Menu Item' : 'New Menu Item'} size="md">
        <form onSubmit={handleSaveItem} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Item Name *</label>
              <input
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
                value={itemForm.name}
                onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Truffle Pasta"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
                value={itemForm.price}
                onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category *</label>
              <select
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
                value={itemForm.category}
                onChange={e => setItemForm(p => ({ ...p, category: e.target.value }))}
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kitchen (optional)</label>
              <select
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
                value={itemForm.kitchen}
                onChange={e => setItemForm(p => ({ ...p, kitchen: e.target.value }))}
              >
                <option value="">No kitchen assigned</option>
                {kitchens.map(k => (
                  <option key={k._id} value={k._id}>{k.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
              <textarea
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all resize-none"
                rows={3}
                value={itemForm.description}
                onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe this dish..."
              />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.isAvailable}
                  onChange={e => setItemForm(p => ({ ...p, isAvailable: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
              <span className="text-sm font-bold text-gray-700">Available for ordering</span>
            </div>
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 mt-2">
            {submitting ? 'Saving...' : itemModal.editing ? 'Update Item' : 'Add to Menu'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
