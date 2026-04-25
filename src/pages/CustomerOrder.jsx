import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CustomerOrder() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placed, setPlaced] = useState(false);
  const [table, setTable] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, tablesRes] = await Promise.all([
          api.get('/menu'),
          api.get('/tables')
        ]);
        setMenu(menuRes.data.items);
        setCategories(menuRes.data.categories);
        if (menuRes.data.categories.length > 0) setSelectedCategory(menuRes.data.categories[0]._id);
        
        if (tableId) {
          const currentTable = tablesRes.data.find(t => t._id === tableId);
          setTable(currentTable);
        }
      } catch (err) {
        console.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableId]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem === item._id);
      if (existing) return prev.map(i => i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const handlePlaceOrder = async () => {
    if (!tableId) return alert('No table detected. Please scan QR again.');
    try {
      await api.post('/orders/public', { tableId, items: cart });
      setPlaced(true);
      setCart([]);
    } catch (err) {
      alert('Order failed: ' + err.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (placed) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-dark-950 text-white">
      <div className="w-20 h-20 bg-brand-success/20 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
      <p className="text-brand-secondary">The kitchen is preparing your meal. Enjoy!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-dark-900/50 sticky top-0 z-10 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-tight">Table {table?.number || 'Menu'}</h1>
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
          {categories.map(cat => (
            <button 
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap border transition-none ${selectedCategory === cat._id ? 'bg-brand-primary border-brand-primary text-white' : 'border-white/10 text-brand-secondary'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 p-4 grid grid-cols-1 gap-4">
        {menu.filter(i => i.category?._id === selectedCategory).map(item => (
          <div key={item._id} className="bg-dark-900 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-sm">{item.name}</h3>
              <p className="text-brand-secondary text-[10px] mt-1 line-clamp-1">{item.description}</p>
              <p className="font-bold text-brand-primary mt-2">${item.price.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => addToCart(item)}
              className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="p-6 bg-dark-900 border-t border-white/5 sticky bottom-0">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-brand-secondary">{cart.length} Items Selected</p>
            <p className="text-lg font-bold text-white">${cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</p>
          </div>
          <button 
            onClick={handlePlaceOrder}
            className="w-full bg-brand-primary py-4 rounded-2xl font-bold text-sm uppercase tracking-widest"
          >
            Send to Kitchen
          </button>
        </div>
      )}
    </div>
  );
}
