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

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, menuRes, kitchensRes] = await Promise.all([
        api.get('/tables'),
        api.get('/menu'),
        api.get('/kitchens'),
      ]);

      const currentTable = tablesRes.data.find(t => t._id === tableId);
      if (!currentTable) throw new Error('Table not found');

      setTable(currentTable);
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

      // Load existing order if occupied
      const currentOrderId = currentTable.currentOrder?._id || currentTable.currentOrder;
      if (currentOrderId) {
        const orderRes = await api.get(`/orders/${currentOrderId}`);
        const order = orderRes.data;
        setExistingOrder(order);
        setCart(order.items.map(i => ({
          menuItem: i.menuItem?._id || i.menuItem,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          kitchen: i.kitchen?._id || i.kitchen || null,
        })));
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
      } else {
        await api.post('/orders', { tableId: table._id, items: cart, totalAmount: total });
        addToast('Order placed!', 'success');
      }
      navigate('/tables');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-32">
      <LoadingSpinner size="lg" />
    </div>
  );

  const filteredItems = menuItems.filter(item =>
    item.category?._id === selectedCategory && item.isAvailable !== false
  );

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 p-1">

      {/* ——— Left: Menu Selection ——— */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Table Header */}
        <div className="card mb-6 overflow-hidden flex-shrink-0 border-slate-200">
          <div className="px-8 py-5 flex items-center justify-between bg-white">
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate('/tables')}
                className="p-3 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 hover:text-brand-primary hover:border-brand-primary/20 hover:bg-white transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Table {table?.number}</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                  {existingOrder ? `Order #${existingOrder._id.slice(-6).toUpperCase()}` : 'New Order'}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 max-w-[60%] custom-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border whitespace-nowrap
                    ${selectedCategory === cat._id
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20'
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-900 hover:border-slate-300 shadow-sm'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Units Grid */}
        <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-40 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Category Registry Empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.menuItem === item._id);
                return (
                  <button
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className={`p-6 rounded-[2rem] text-left h-48 flex flex-col justify-between transition-all relative overflow-hidden group border-2
                      ${inCart
                        ? 'bg-brand-primary/5 border-brand-primary/30 shadow-2xl shadow-brand-primary/5'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xl shadow-sm'}`}
                  >
                    {inCart && (
                      <div className="absolute top-5 right-5 bg-brand-primary text-white text-[11px] font-black w-8 h-8 rounded-xl flex items-center justify-center shadow-xl shadow-brand-primary/20 scale-110">
                        {inCart.quantity}
                      </div>
                    )}
                    <div>
                      <h3 className={`font-black text-base leading-tight tracking-tight transition-colors mb-3 pr-8 ${inCart ? 'text-brand-primary' : 'text-slate-900'}`}>
                        {item.name}
                      </h3>
                      {item.kitchenData && (
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm"
                          style={{ backgroundColor: item.kitchenData.displayColor || '#3B82F6' }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                          {item.kitchenData.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <span className={`font-black text-2xl tracking-tighter ${inCart ? 'text-brand-primary' : 'text-slate-900'}`}>
                        ${item.price.toFixed(2)}
                      </span>
                      {!inCart && (
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner border border-slate-100">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pipeline Strip */}
        {existingOrder?.kitchenOrders?.length > 0 && (
          <div className="card mt-6 py-6 px-8 border-slate-200 shadow-lg shadow-slate-200/20">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Transmission Pipeline</p>
            <div className="flex gap-4 flex-wrap">
              {existingOrder.kitchenOrders.map((ko, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 px-5 py-2.5 rounded-xl text-[10px] font-black border tracking-widest uppercase transition-all shadow-sm ${KITCHEN_STATUS_COLORS[ko.status] || 'bg-slate-50 text-slate-300'}`}
                >
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: ko.kitchen?.displayColor || '#6FC4E8', boxShadow: `0 0 10px ${ko.kitchen?.displayColor}44` }}
                  ></div>
                  {ko.kitchen?.name || 'NODE'}: {ko.status}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ——— Right: Order Management ——— */}
      <div className="w-[420px] card flex flex-col overflow-hidden border-slate-200 shadow-2xl shadow-slate-200/40">
        <div className="px-8 py-8 flex items-center justify-between border-b border-slate-50 bg-white">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            {existingOrder ? 'Order' : 'Initialize Session'}
          </h2>
          <div className="flex items-center gap-4">
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em]">
                Remove all
              </button>
            )}
            <span className="badge bg-slate-50 border-slate-100 text-slate-500 font-black px-4 py-2 text-[10px] tracking-widest shadow-sm">
              {cart.reduce((s, i) => s + i.quantity, 0)} Units
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-slate-50/20">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Table Empty</p>
            </div>
          ) : (
            cart.map(item => {
              const kitchenData = kitchens.find(k => k._id === item.kitchen);
              return (
                <div key={item.menuItem} className="bg-white border border-slate-100 p-6 rounded-3xl group transition-all hover:border-slate-300 hover:shadow-xl shadow-sm">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex-1 pr-6">
                      <p className="text-slate-900 font-black text-base leading-tight group-hover:text-brand-primary transition-colors tracking-tight">{item.name}</p>
                      {kitchenData && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: kitchenData.displayColor }}></div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Route: {kitchenData.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeFromCart(item.menuItem)} className="text-slate-200 hover:text-rose-500 transition-colors p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-inner">
                      <button onClick={() => updateQuantity(item.menuItem, -1)} className="w-9 h-9 rounded-xl hover:bg-white text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 flex items-center justify-center font-black text-lg transition-all shadow-none hover:shadow-sm">−</button>
                      <span className="text-slate-900 font-black text-sm w-10 text-center tracking-tighter">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItem, 1)} className="w-9 h-9 rounded-xl hover:bg-white text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 flex items-center justify-center font-black text-lg transition-all shadow-none hover:shadow-sm">+</button>
                    </div>
                    <p className="text-slate-900 font-black text-xl tracking-tighter">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-8 py-10 border-t border-slate-100 bg-white">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">Total Valuation</p>
              <div className="h-1 w-12 bg-brand-primary/20 rounded-full"></div>
            </div>
            <p className="text-slate-900 font-black text-5xl tracking-tighter">${total.toFixed(2)}</p>
          </div>
          <button
            onClick={placeOrder}
            disabled={submitting || cart.length === 0}
            className="btn-primary w-full py-6 text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-primary/30"
          >
            {submitting ? 'Processing...' : existingOrder ? '⟳ Update Order' : '✓ Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

