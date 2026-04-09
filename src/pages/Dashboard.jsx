import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalSales: 0, activeOrders: 0, occupiedTables: 0, totalTables: 0, popularItems: [] });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      const [ordersRes, tablesRes, menuRes] = await Promise.all([
        api.get('/orders'),
        api.get('/tables'),
        api.get('/menu'),
      ]);

      const allOrders = ordersRes.data;
      const paidOrders = allOrders.filter(o => o.status === 'paid');
      const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const activeOrders = allOrders.filter(o => !['paid', 'cancelled'].includes(o.status)).length;
      const occupiedTables = tablesRes.data.filter(t => t.status === 'occupied').length;
      const totalTables = tablesRes.data.length;

      // FIX: avg order value should divide by paid orders count, not active orders
      const avgOrderVal = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

      setStats({
        totalSales,
        activeOrders,
        occupiedTables,
        totalTables,
        avgOrderVal,
        popularItems: menuRes.data.items.slice(0, 4),
        recentOrders: allOrders.slice(0, 5),
      });
    } catch (err) {
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full p-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Synchronizing data...</p>
      </div>
    </div>
  );

  const cards = [
    { label: "Today's Revenue", value: `$${stats.totalSales.toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '💰', border: 'border-emerald-100' },
    { label: 'Active Orders', value: stats.activeOrders, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🍽️', border: 'border-blue-100' },
    { label: 'Tables Occupied', value: `${stats.occupiedTables} / ${stats.totalTables}`, color: 'text-amber-600', bg: 'bg-amber-50', icon: '🪑', border: 'border-amber-100' },
    { label: 'Avg. Order Value', value: `$${(stats.avgOrderVal || 0).toFixed(2)}`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '📊', border: 'border-indigo-100' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600';
      case 'preparing': return 'bg-amber-50 text-amber-600';
      case 'pending': return 'bg-blue-50 text-blue-600';
      case 'served': return 'bg-indigo-50 text-indigo-600';
      case 'cancelled': return 'bg-rose-50 text-rose-600';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time performance — AJARK POS</p>
        </div>
        <button onClick={fetchDashboardStats} className="text-xs font-black text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card, i) => (
          <div key={i} className={`bg-white border-2 ${card.border} p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-all duration-300`}>
            <div className={`text-2xl mb-4 p-3 ${card.bg} w-fit rounded-2xl`}>{card.icon}</div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-3xl font-black ${card.color} tracking-tight`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Popular Items */}
        <div className="lg:col-span-1 bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Menu Highlights</h2>
          <div className="space-y-4">
            {stats.popularItems.map((item, i) => (
              <div key={item._id} className="flex items-center gap-4 hover:bg-gray-50 p-3 rounded-2xl transition-colors group">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-bold text-sm truncate">{item.name}</p>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">{item.category?.name}</p>
                </div>
                <p className="text-indigo-600 font-black text-sm shrink-0">${item.price.toFixed(2)}</p>
              </div>
            ))}
            {stats.popularItems.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No menu items yet</p>}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Recent Orders</h2>
          <div className="space-y-3">
            {(stats.recentOrders || []).map((order) => (
              <div key={order._id} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-gray-900 font-black text-sm">Table {order.table?.number || '?'}</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-widest ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <p className="text-gray-400 text-[10px] mt-0.5">{order.waiter?.name} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="text-gray-900 font-black text-base shrink-0">${order.totalAmount.toFixed(2)}</p>
              </div>
            ))}
            {(!stats.recentOrders || stats.recentOrders.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No orders yet today</p>
              </div>
            )}
          </div>
        </div>

        {/* Kitchen Status Panel */}
        <div className="lg:col-span-3 bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-indigo-200">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-2">Kitchen Activity</h2>
              <p className="text-indigo-100 leading-relaxed text-sm">
                {stats.occupiedTables > 0
                  ? `${stats.occupiedTables} of ${stats.totalTables} tables are active. ${stats.activeOrders} orders in the kitchen.`
                  : `All ${stats.totalTables} tables are available. Ready for service!`}
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="text-center bg-white/10 px-6 py-4 rounded-2xl border border-white/20">
                <p className="text-3xl font-black">{stats.activeOrders}</p>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">In Kitchen</p>
              </div>
              <div className="text-center bg-white/10 px-6 py-4 rounded-2xl border border-white/20">
                <p className="text-3xl font-black">{stats.totalTables - stats.occupiedTables}</p>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">Free Tables</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
        </div>
      </div>
    </div>
  );
}
