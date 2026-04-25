import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const KITCHEN_STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  preparing: 'bg-blue-50 text-blue-600 border-blue-100',
  ready: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  completed: 'bg-slate-50 text-slate-300 border-slate-100',
};

export default function OrderPortal() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [table, setTable] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderType, setOrderType] = useState('DINE_IN');
  const [source, setSource] = useState('DIRECT');

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, menuRes, kitchensRes] = await Promise.all([
        api.get('/tables'),
        api.get('/menu'),
        api.get('/kitchens'),
      ]);

      const isWalkin = tableId === 'walkin';
      
      if (isWalkin) {
        setTable({ _id: null, number: 'Walk-in' });
      } else {
        const currentTable = tablesRes.data.find(t => t._id === tableId);
        if (!currentTable) throw new Error('Table not found');
        setTable(currentTable);
        
        // Load existing order if occupied
        const currentOrderId = currentTable.currentOrder?._id || currentTable.currentOrder;
        if (currentOrderId) {
          const orderRes = await api.get(`/orders/${currentOrderId}`);
          const order = orderRes.data;
          setExistingOrder(order);
          setOrderType(order.orderType || 'DINE_IN');
          setSource(order.source || 'DIRECT');
          setCart(order.items.map(i => ({
            menuItem: i.menuItem?._id || i.menuItem,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            kitchen: i.kitchen?._id || i.kitchen || null,
          })));
        }
      }

      setKitchens(kitchensRes.data.data || []);

      // Merge kitchen data into items
      const kitchenMap = {};
      (kitchensRes.data.data || []).forEach(k => { kitchenMap[k._id] = k; });

      const enrichedItems = menuRes.data.items.map(item => ({
        ...item,
        kitchenData: item.kitchen ? kitchenMap[item.kitchen?._id || item.kitchen] : null,
      }));

      setCategories(menuRes.data.categories);
      setMenuItems(enrichedItems);
      if (menuRes.data.categories.length > 0) {
        setSelectedCategory(menuRes.data.categories[0]._id);
      }
    } catch (err) {
      addToast(err.message, 'error');
      navigate('/tables');
    } finally {
      setLoading(false);
    }
  }, [tableId, addToast, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem === item._id);
      if (existing) {
        return prev.map(i => i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menuItem: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        kitchen: item.kitchen?._id || item.kitchen || null,
      }];
    });
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(i => i.menuItem !== itemId));

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.menuItem === itemId) {
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return addToast('Cart is empty', 'warning');
    setSubmitting(true);
    try {
      if (existingOrder) {
        await api.put(`/orders/${existingOrder._id}`, { items: cart });
        addToast('Order updated!', 'success');
        navigate('/tables');
      } else {
        const isWalkin = tableId === 'walkin';
        await api.post('/orders', { 
          tableId: isWalkin ? null : table?._id, 
          items: cart, 
          totalAmount: total,
          orderType,
          source,
        });
        addToast('Order placed!', 'success');
        navigate(isWalkin ? '/orders' : '/tables');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh] bg-background">
      <LoadingSpinner />
    </div>
  );

  const filteredItems = menuItems.filter(item =>
    item.category?._id === selectedCategory && item.isAvailable !== false
  );

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Left: Menu selection */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="card mb-6 flex-shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/tables')}
                className="btn-secondary p-2 transition-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">Table {table?.number}</h1>
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                  {existingOrder ? `Order #${existingOrder._id.slice(-6).toUpperCase()}` : 'New Order'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex bg-surface rounded-lg p-1 border border-border">
                {['DINE_IN', 'TAKEAWAY', 'ONLINE'].map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-none ${orderType === t ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {orderType === 'ONLINE' && (
                <div className="flex bg-surface rounded-lg p-1 border border-border">
                  {['DIRECT', 'SWIGGY', 'ZOMATO'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSource(s)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-none ${source === s ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 max-w-[40%]">
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-none border whitespace-nowrap
                    ${selectedCategory === cat._id
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-surface text-text-muted border-border hover:text-text-primary'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-text-muted font-semibold uppercase tracking-widest text-xs">No items in category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.menuItem === item._id);
                return (
                  <button
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className={`p-5 card text-left h-40 flex flex-col justify-between transition-none relative group border-2
                      ${inCart ? 'border-brand-primary bg-brand-primary/5' : 'border-border'}`}
                  >
                    {inCart && (
                      <div className="absolute top-4 right-4 bg-brand-primary text-white text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center">
                        {inCart.quantity}
                      </div>
                    )}
                    <div>
                      <h3 className={`font-bold text-sm leading-tight tracking-tight mb-2 pr-8 ${inCart ? 'text-brand-primary' : 'text-text-primary'}`}>
                        {item.name}
                      </h3>
                      {item.kitchenData && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: item.kitchenData.displayColor || '#3B82F6' }}
                        >
                          {item.kitchenData.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <span className={`font-bold text-lg tracking-tight ${inCart ? 'text-brand-primary' : 'text-text-primary'}`}>
                        ${item.price.toFixed(2)}
                      </span>
                      {!inCart && (
                        <div className="w-7 h-7 rounded bg-background border border-border flex items-center justify-center text-text-muted group-hover:text-brand-primary group-hover:border-brand-primary transition-none">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Kitchen Status Pipeline */}
        {existingOrder?.kitchenOrders?.length > 0 && (
          <div className="card mt-6 py-4 px-6">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Kitchen Pipeline</p>
            <div className="flex gap-3 flex-wrap">
              {existingOrder.kitchenOrders.map((ko, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold border tracking-wider uppercase transition-none ${
                    ko.status === 'completed' ? 'status-green opacity-50' :
                    ko.status === 'ready' ? 'status-green' :
                    ko.status === 'preparing' ? 'status-blue' : 'status-orange'
                  }`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ko.kitchen?.displayColor || '#6FC4E8' }}
                  ></div>
                  {ko.kitchen?.name || 'STATION'}: {ko.status}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Cart side panel */}
      <div className="w-[380px] card flex flex-col overflow-hidden">
        <div className="px-6 py-6 flex items-center justify-between border-b border-border">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">Cart</h2>
          <span className="badge status-blue text-[10px]">
            {cart.reduce((s, i) => s + i.quantity, 0)} Units
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">No items selected</p>
            </div>
          ) : (
            cart.map(item => {
              const kitchenData = kitchens.find(k => k._id === item.kitchen);
              return (
                <div key={item.menuItem} className="bg-surface border border-border p-4 rounded-lg group transition-none">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                      <p className="text-text-primary font-bold text-sm tracking-tight group-hover:text-brand-primary transition-none">{item.name}</p>
                      {kitchenData && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: kitchenData.displayColor }}></div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                            {kitchenData.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeFromCart(item.menuItem)} className="text-text-muted hover:text-brand-danger transition-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 bg-background border border-border rounded p-1">
                      <button onClick={() => updateQuantity(item.menuItem, -1)} className="w-7 h-7 rounded hover:bg-surface text-text-muted hover:text-text-primary flex items-center justify-center font-bold text-sm transition-none">−</button>
                      <span className="text-text-primary font-bold text-xs w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItem, 1)} className="w-7 h-7 rounded hover:bg-surface text-text-muted hover:text-text-primary flex items-center justify-center font-bold text-sm transition-none">+</button>
                    </div>
                    <p className="text-text-primary font-bold text-base tracking-tight">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-6 border-t border-border bg-surface">
          <div className="flex justify-between items-end mb-6">
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Total Valuation</p>
            <p className="text-text-primary font-bold text-3xl tracking-tight">${total.toFixed(2)}</p>
          </div>
          <button
            onClick={placeOrder}
            disabled={submitting || cart.length === 0}
            className="btn-primary w-full py-4 text-xs font-bold uppercase tracking-widest"
          >
            {submitting ? 'Processing...' : existingOrder ? 'Update Order' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
