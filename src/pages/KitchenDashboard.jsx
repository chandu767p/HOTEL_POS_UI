import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import socketService from '../services/socketService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STATUS_CLASSES = {
  pending: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
  preparing: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  ready: 'bg-brand-success/10 text-brand-success border-brand-success/20',
  completed: 'bg-border/50 text-text-muted border-border',
};

const WAVE_BORDER_COLORS = [
  'border-l-brand-warning',
  'border-l-brand-primary',
  'border-l-brand-success',
  'border-l-brand-info',
  'border-l-brand-danger',
];

export default function KitchenDashboard() {
  const { kitchenId: kitchenName } = useParams();
  const [orders, setOrders] = useState([]);
  const [kitchen, setKitchen] = useState(null);
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, kitchensRes] = await Promise.all([
        api.get('/orders?status=preparing,ready,pending'),
        api.get('/kitchens')
      ]);
      setOrders(ordersRes.data);
      const allKitchens = kitchensRes.data.data || [];
      setKitchens(allKitchens);
      
      if (kitchenName && kitchenName !== 'all') {
        const decodedName = decodeURIComponent(kitchenName).toLowerCase();
        const current = allKitchens.find(k => k.name.toLowerCase() === decodedName);
        setKitchen(current);
      } else {
        setKitchen(null);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, kitchenName]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Audio init failed');
    }
  };

  useEffect(() => {
    fetchData();
    socketService.connect();
    
    socketService.on('new-order', (newOrder) => {
      // Check if any kitchen order name matches current display
      const hasRelevantItems = !kitchenName || kitchenName === 'all' || 
        newOrder.kitchenOrders?.some(ko => ko.kitchen?.name === kitchen?.name);

      if (hasRelevantItems) {
        setOrders(prev => {
          if (prev.find(o => o._id === newOrder._id)) return prev;
          return [newOrder, ...prev];
        });
        addToast(`New Ticket: ${newOrder.table?.number ? 'Table ' + newOrder.table.number : 'Walk-in'}`, 'info');
        playNotificationSound();
      }
    });

    socketService.on('order-updated', (updatedOrder) => {
      setOrders(prev => {
        const index = prev.findIndex(o => o._id === updatedOrder._id);
        if (index === -1) {
           const hasRelevantItems = !kitchenName || kitchenName === 'all' || 
             updatedOrder.kitchenOrders?.some(ko => ko.kitchen?.name === kitchen?.name);
           return hasRelevantItems ? [updatedOrder, ...prev] : prev;
        }
        const newOrders = [...prev];
        newOrders[index] = updatedOrder;
        return newOrders;
      });
      addToast(`Update: ${updatedOrder.table?.number ? 'Table ' + updatedOrder.table.number : 'Walk-in'}`, 'warning');
      playNotificationSound();
    });

    socketService.on('kitchen-status-updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    return () => {
      socketService.off('new-order');
      socketService.off('order-updated');
      socketService.off('kitchen-status-updated');
    };
  }, [fetchData, addToast, kitchenName]);

  const handleStatusUpdate = async (orderId, koId, currentStatus) => {
    const statusFlow = ['pending', 'preparing', 'ready', 'completed'];
    const nextIdx = statusFlow.indexOf(currentStatus) + 1;
    if (nextIdx >= statusFlow.length) return;

    const nextStatus = statusFlow[nextIdx];

    try {
      await api.patch(`/orders/${orderId}/kitchen-order/${koId}`, { status: nextStatus });
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh] bg-background">
      <LoadingSpinner />
    </div>
  );

  const allKitchenOrders = orders.flatMap(order =>
    (order.kitchenOrders || []).map(ko => ({
      ...ko,
      orderId: order._id,
      tableNumber: order.table?.number,
      waiterName: order.waiter?.name,
      orderCreatedAt: order.createdAt
    }))
  ).filter(ko => {
    // Status filter
    if (ko.status === 'completed') return false;
    // Kitchen Name filter
    if (kitchen && kitchenName !== 'all') {
      return (ko.kitchen?.name === kitchen.name);
    }
    return true;
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const filteredKitchenOrders = activeFilter === 'all'
    ? allKitchenOrders
    : allKitchenOrders.filter(ko => ko.status === activeFilter);


  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className={`w-2 h-2 rounded-full ${kitchen ? 'bg-brand-primary' : 'bg-brand-success'}`}></div>
             <h1 className="text-2xl font-bold text-text-primary tracking-tight">
               {kitchen ? kitchen.name : 'Master Kitchen Display'}
             </h1>
          </div>
          <p className="text-text-muted text-xs">
            {kitchen ? `Station ID: ${kitchen._id.slice(-6).toUpperCase()}` : 'Consolidated view of all active kitchen stations'}
          </p>
        </div>

        {/* Station Switcher (Simple) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          <Link 
            to="/kitchen" 
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-none whitespace-nowrap
              ${!kitchenName || kitchenName === 'all' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-surface text-text-muted border-border hover:border-text-muted'}`}
          >
            All Stations
          </Link>
          {kitchens.map(k => (
            <Link 
              key={k._id}
              to={`/kitchen/${encodeURIComponent(k.name)}`}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-none whitespace-nowrap
                ${kitchenName === k.name ? 'bg-brand-primary text-white border-brand-primary' : 'bg-surface text-text-muted border-border hover:border-text-muted'}`}
            >
              {k.name}
            </Link>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-surface p-1 border border-border rounded-lg shadow-sm">
          {['all', 'pending', 'preparing', 'ready'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-tight transition-none
                ${activeFilter === filter
                  ? 'bg-background text-text-primary border border-border shadow-subtle'
                  : 'text-text-muted hover:text-text-secondary'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredKitchenOrders.map((ko) => (
          <div key={ko._id} className={`card flex flex-col h-full border-l-4 ${WAVE_BORDER_COLORS[(ko.wave - 1) % WAVE_BORDER_COLORS.length]}`}>
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-border bg-background/30">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  #{ko.orderId.slice(-6).toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white uppercase px-1.5 py-0.5 bg-brand-primary rounded shadow-sm">
                    Wave {ko.wave || 1}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-text-primary tracking-tighter">
                    {ko.tableNumber ? `TABLE ${ko.tableNumber}` : 'WALK-IN'}
                  </h3>
                  {!kitchen && (
                    <p className="text-brand-primary text-[10px] font-black uppercase mt-1 tracking-widest">
                      {ko.kitchen?.name || 'GENERAL'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-text-primary font-bold text-xs tabular-nums">
                    {new Date(ko.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{ko.waiterName || 'Staff'}</span>
                </div>
                <span className={`badge ${STATUS_CLASSES[ko.status]} text-[10px]`}>
                  {ko.status}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {ko.items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-bold text-text-secondary leading-snug uppercase tracking-tight">{item.name}</p>
                      {item.notes && (
                        <div className="bg-brand-warning/10 border-l-2 border-brand-warning px-2 py-1 mt-2">
                           <p className="text-[10px] text-brand-warning font-bold uppercase italic">Note: {item.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-text-primary tracking-tighter">×{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="mt-8">
                <button
                  onClick={() => handleStatusUpdate(ko.orderId, ko._id, ko.status)}
                  className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95
                    ${ko.status === 'pending' ? 'bg-brand-warning text-white shadow-brand-warning/20' : 
                      ko.status === 'preparing' ? 'bg-brand-primary text-white shadow-brand-primary/20' : 
                      ko.status === 'ready' ? 'bg-brand-success text-white shadow-brand-success/20' : 
                      'bg-border text-text-muted'}`}
                >
                  {ko.status === 'pending' ? 'Start Preparing' : ko.status === 'preparing' ? 'Mark Ready' : ko.status === 'ready' ? 'Handover' : 'Completed'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredKitchenOrders.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-surface/30">
            <div className="w-16 h-16 rounded-full bg-border/20 flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
            <p className="text-text-muted font-bold uppercase tracking-widest text-xs">No active tickets for this station</p>
          </div>
        )}
      </div>
    </div>
  );
}
