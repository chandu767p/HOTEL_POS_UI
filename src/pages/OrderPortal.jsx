import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const KITCHEN_STATUS_COLORS = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  preparing: 'bg-blue-100 text-blue-700 border-blue-200',
  ready:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-gray-100 text-gray-500 border-gray-200',
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
      // NOTE: getTables populates currentOrder as a full object — extract ._id safely
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
  }, [tableId]);

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
    if (cart.length === 0) return addToast('Cart is empty — add some items', 'warning');
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
    <div className="flex items-center justify-center h-full p-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading POS Terminal...</p>
      </div>
    </div>
  );

  const filteredItems = menuItems.filter(item =>
    item.category?._id === selectedCategory && item.isAvailable !== false
  );

  return (
    <div className="h-[calc(100vh-80px)] flex gap-0 md:gap-6 p-4 md:p-6">

      {/* ——— Left: Menu ——— */}
      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="p-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tables')}
              className="w-9 h-9 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Table {table?.number}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {existingOrder ? `Order #${existingOrder._id.slice(-6).toUpperCase()}` : 'New Order'}
                </p>
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${selectedCategory === cat._id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="font-black text-sm uppercase tracking-widest">No items in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.menuItem === item._id);
                return (
                  <button
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className={`relative group p-5 rounded-3xl text-left flex flex-col justify-between h-36 transition-all active:scale-95
                      ${inCart
                        ? 'bg-indigo-50 border-2 border-indigo-200 shadow-md shadow-indigo-100'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-lg'}`}
                  >
                    {inCart && (
                      <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                        {inCart.quantity}
                      </div>
                    )}
                    <div>
                      <h3 className={`font-bold text-sm leading-tight ${inCart ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {item.name}
                      </h3>
                      {item.kitchenData && (
                        <div
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white"
                          style={{ backgroundColor: item.kitchenData.displayColor }}
                        >
                          {item.kitchenData.name}
                        </div>
                      )}
                    </div>
                    <span className={`font-black text-lg tracking-tight ${inCart ? 'text-indigo-600' : 'text-gray-900'}`}>
                      ${item.price.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Kitchen status strip for existing order */}
        {existingOrder?.kitchenOrders?.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-4 shrink-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kitchen Progress</p>
            <div className="flex gap-2 flex-wrap">
              {existingOrder.kitchenOrders.map((ko, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black border tracking-widest uppercase ${KITCHEN_STATUS_COLORS[ko.status] || 'bg-gray-100 text-gray-500'}`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ko.kitchen?.displayColor || '#6366f1' }}
                  ></div>
                  {ko.kitchen?.name || 'Kitchen'}: {ko.status}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ——— Right: Cart ——— */}
      <div className="w-80 lg:w-96 flex flex-col bg-gray-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden shrink-0">
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-white tracking-tight">
              {existingOrder ? 'Update Order' : 'New Order'}
            </h2>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-[10px] font-black text-white/30 hover:text-rose-400 transition-colors uppercase tracking-widest">
                  Clear
                </button>
              )}
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20 py-16">
                <div className="text-5xl mb-3">🛒</div>
                <p className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Tap items to add</p>
              </div>
            ) : (
              cart.map(item => {
                const kitchenData = kitchens.find(k => k._id === item.kitchen);
                return (
                  <div key={item.menuItem} className="bg-white/8 border border-white/10 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-2">
                        <p className="text-white font-bold text-sm leading-tight">{item.name}</p>
                        {kitchenData && (
                          <span
                            className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md mt-0.5 inline-block text-white"
                            style={{ backgroundColor: kitchenData.displayColor + 'aa' }}
                          >
                            {kitchenData.name}
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.menuItem)} className="text-white/30 hover:text-rose-400 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
                        <button onClick={() => updateQuantity(item.menuItem, -1)} className="w-7 h-7 rounded-lg hover:bg-white/20 text-white flex items-center justify-center font-black text-sm transition-colors">−</button>
                        <span className="text-white font-black text-sm w-7 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItem, 1)} className="w-7 h-7 rounded-lg hover:bg-white/20 text-white flex items-center justify-center font-black text-sm transition-colors">+</button>
                      </div>
                      <p className="text-indigo-400 font-black">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Subtotal</p>
              <p className="text-white font-black text-2xl tracking-tight">${total.toFixed(2)}</p>
            </div>
            <button
              onClick={placeOrder}
              disabled={submitting || cart.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/30"
            >
              {submitting ? 'Processing...' : existingOrder ? '⟳ Update Order' : '✓ Place Order'}
            </button>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </div>
    </div>
  );
}
