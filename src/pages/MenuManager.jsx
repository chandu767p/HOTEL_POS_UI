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
    <div className="flex items-center justify-center p-32 bg-background min-h-[60vh]">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Menu Management</h1>
          <p className="text-text-muted text-xs mt-1">{items.length} items in registry</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddCat} className="btn-secondary px-4 py-2 text-[11px] font-bold uppercase tracking-wider">
            + Category
          </button>
          <button onClick={openAddItem} className="btn-primary px-4 py-2 text-[11px] font-bold uppercase tracking-wider">
            + Item
          </button>
          <button onClick={openAddCombo} className="bg-brand-info/10 text-brand-info border border-brand-info/20 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-brand-info/20">
            + Combo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
        {/* Categories Sidebar */}
        <div className="card p-2 space-y-1">
          <p className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Categories</p>
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-none
                ${selectedCategoryId === 'all'
                ? 'bg-brand-primary text-white'
                : 'text-text-muted hover:bg-background hover:text-text-primary'}`}
          >
            <div className="flex items-center justify-between">
              <span>All Items</span>
              <span className="text-[11px] opacity-70">{items.length}</span>
            </div>
          </button>

          {categories.map(cat => (
            <div key={cat._id} className="group relative">
              <button
                onClick={() => setSelectedCategoryId(cat._id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-none pr-16
                    ${selectedCategoryId === cat._id
                    ? 'bg-surface text-text-primary border border-border shadow-subtle'
                    : 'text-text-muted hover:bg-background hover:text-text-primary'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[11px] opacity-70">{items.filter(i => i.category?._id === cat._id).length}</span>
                </div>
              </button>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1  transition-none">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}
                  className="p-1 rounded hover:bg-background text-text-muted hover:text-text-primary"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat); }}
                  className="p-1 rounded hover:bg-brand-danger/10 text-text-muted hover:text-brand-danger"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Master Registry Grid */}
        <div>
          {displayedItems.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-border rounded-2xl">
              <p className="text-text-muted font-semibold uppercase tracking-widest text-xs">Category is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {displayedItems.map(item => (
                <div
                  key={item._id}
                  className={`card p-5 group transition-none ${item.isAvailable === false ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 bg-background border border-border rounded-lg flex items-center justify-center text-text-muted font-bold text-lg group-hover:text-brand-primary group-hover:border-brand-primary transition-none">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Dietary */}
                      <div className="absolute -top-1 -right-1">
                        {item.dietary === 'veg' && <div className="w-4 h-4 bg-background border border-brand-success p-[2px] rounded-sm"><div className="w-full h-full bg-brand-success rounded-full"></div></div>}
                        {item.dietary === 'non-veg' && <div className="w-4 h-4 bg-background border border-brand-danger p-[2px] rounded-sm"><div className="w-full h-full bg-brand-danger rounded-full"></div></div>}
                        {item.dietary === 'egg' && <div className="w-4 h-4 bg-background border border-brand-warning p-[2px] rounded-sm"><div className="w-full h-full bg-brand-warning rounded-full"></div></div>}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-text-primary font-bold text-sm truncate uppercase tracking-tight group-hover:text-brand-primary transition-none">
                          {item.name}
                        </h3>
                        <span className="text-text-primary font-bold text-base tracking-tight">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-text-muted text-[11px] font-medium leading-normal line-clamp-1 mt-0.5">
                        {item.description || 'No description provided.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-background text-text-muted border border-border rounded">
                          {item.category?.name}
                        </span>
                        {item.isBundle && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-info/10 text-brand-info border border-brand-info/20 rounded">
                            Combo
                          </span>
                        )}
                        {item.kitchen && (() => {
                          const k = kitchens.find(k => k._id === (item.kitchen?._id || item.kitchen));
                          return k ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-border text-text-muted rounded" style={{ borderColor: k.displayColor + '40' }}>
                              {k.name}
                            </span>
                          ) : null;
                        })()}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-none
                            ${item.isAvailable !== false
                              ? 'text-brand-success bg-brand-success/5 border border-brand-success/10 hover:bg-brand-success/10'
                              : 'text-text-muted bg-border/20 border border-border/30 hover:bg-border/30'}`}
                        >
                          {item.isAvailable !== false ? 'Available' : 'Sold Out'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditItem(item)}
                            className="p-1.5 rounded bg-background text-text-muted hover:text-text-primary border border-border transition-none"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded bg-brand-danger/5 text-brand-danger/60 hover:text-brand-danger border border-brand-danger/10 transition-none"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
      <Modal isOpen={catModal.open} onClose={() => setCatModal({ open: false, editing: null })} title={catModal.editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSaveCat} className="space-y-6 pt-2">
          <div className="space-y-1.5">
            <label className="form-label">Category Name</label>
            <input
              className="form-input"
              value={catForm.name}
              onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Appetizers"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="form-label">Description</label>
            <textarea
              className="form-input min-h-[100px]"
              value={catForm.description}
              onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Summary..."
            />
          </div>
          <button disabled={submitting} type="submit" className="btn-primary w-full py-3 text-xs uppercase tracking-widest">
            {submitting ? 'Processing...' : 'Save Category'}
          </button>
        </form>
      </Modal>

      {/* Item Modal */}
      <Modal isOpen={itemModal.open} onClose={() => setItemModal({ open: false, editing: null })} title={itemModal.editing ? 'Edit Item' : 'New Item'} size="md">
        <form onSubmit={handleSaveItem} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="form-label">Item Name</label>
              <input
                className="form-input"
                value={itemForm.name}
                onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Product title"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Price ($)</label>
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

            <div className="space-y-1.5">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={itemForm.category}
                onChange={e => setItemForm(p => ({ ...p, category: e.target.value }))}
                required
              >
                <option value="">Select</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <label className="form-label">Dietary Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['none', 'veg', 'non-veg', 'egg'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setItemForm(p => ({ ...p, dietary: type }))}
                    className={`py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-none
                      ${itemForm.dietary === type
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-surface text-text-muted border-border'}`}
                  >
                    {type === 'none' ? 'Gen' : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Is Bundle / Combo?</span>
              <input
                type="checkbox"
                checked={itemForm.isBundle}
                onChange={e => setItemForm(p => ({ ...p, isBundle: e.target.checked }))}
                className="w-4 h-4 bg-background border-border rounded focus:ring-brand-primary"
              />
            </div>

            {itemForm.isBundle && (
              <div className="sm:col-span-2 p-4 bg-background border border-border rounded-lg space-y-3">
                <label className="form-label">Combo Components</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
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
                        className={`flex items-center justify-between px-3 py-2 rounded border text-xs font-semibold transition-none
                          ${isSelected ? 'bg-surface border-brand-primary text-brand-primary' : 'bg-surface border-border text-text-muted'}`}
                      >
                        <span className="truncate flex-1 text-left">{i.name}</span>
                        {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 space-y-1.5">
              <label className="form-label">Description</label>
              <textarea
                className="form-input min-h-[100px]"
                value={itemForm.description}
                onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Product description..."
              />
            </div>
          </div>

          <button disabled={submitting} type="submit" className="btn-primary w-full py-3 text-xs uppercase tracking-widest">
            {submitting ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      </Modal>
    </div>
  );
}