import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeOrders: 0,
    occupiedTables: 0,
    totalTables: 0,
    avgOrderVal: 0,
    popularItems: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      const [ordersRes, tablesRes, bestSellersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/tables'),
        api.get('/orders/best-sellers?limit=4'),
      ]);

      const allOrders = ordersRes.data;
      const paidOrders = allOrders.filter(o => o.status === 'paid');
      const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const activeOrders = allOrders.filter(o => !['paid', 'cancelled'].includes(o.status)).length;
      const occupiedTables = tablesRes.data.filter(t => t.status === 'occupied').length;
      const totalTables = tablesRes.data.length;
      const avgOrderVal = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

      setStats({
        totalSales,
        activeOrders,
        occupiedTables,
        totalTables,
        avgOrderVal,
        popularItems: bestSellersRes.data,
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
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Loading Dashboard...</p>
      </div>
    </div>
  );

  // Different color schemes for each card
  const cards = [
    { label: "Today's Revenue", value: `$${stats.totalSales.toFixed(2)}`, color: 'text-blue-600', bg: 'bg-blue-50', icon: '💰', border: 'border-blue-100' },
    { label: 'Active Orders', value: stats.activeOrders, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🍽️', border: 'border-emerald-100' },
    { label: 'Tables Occupied', value: `${stats.occupiedTables} / ${stats.totalTables}`, color: 'text-amber-600', bg: 'bg-amber-50', icon: '🪑', border: 'border-amber-100' },
    { label: 'Avg. Order Val', value: `$${(stats.avgOrderVal || 0).toFixed(2)}`, color: 'text-purple-600', bg: 'bg-purple-50', icon: '📊', border: 'border-purple-100' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'preparing': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'served': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-white">
      {/* Header */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-gray-800 tracking-tighter">Overview</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-3">Live performance metrics</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-all shadow-sm border border-gray-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards - each with a distinct color */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`rounded-2xl border ${card.border} ${card.bg} p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`text-3xl mb-4`}>{card.icon}</div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-3xl font-black ${card.color} tracking-tight`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Popular Items - pink/rose theme */}
        <div className="lg:col-span-1 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-rose-600 mb-6 tracking-tight flex items-center gap-2">
            <span>🔥</span> Popular Items
          </h2>
          <div className="space-y-3">
            {stats.popularItems.map((item, i) => (
              <div key={item._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-rose-50 transition-colors">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-black text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-bold text-sm">{item.name}</p>
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{item.totalSold} units sold</p>
                </div>
                <p className="text-rose-600 font-black text-sm">${item.revenue?.toFixed(2) || '0.00'}</p>
              </div>
            ))}
            {stats.popularItems.length === 0 && (
              <p className="text-gray-400 text-xs text-center py-6">No items found</p>
            )}
          </div>
        </div>

        {/* Recent Orders - blue/cyan theme */}
        <div className="lg:col-span-2 rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-cyan-600 mb-6 tracking-tight flex items-center gap-2">
            <span>📋</span> Recent Activity
          </h2>
          <div className="space-y-3">
            {(stats.recentOrders || []).map((order) => (
              <div key={order._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-cyan-50 transition-colors border border-transparent hover:border-cyan-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-gray-800 font-bold text-sm">Table {order.table?.number || '?'}</p>
                    <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] font-semibold mt-1.5">
                    {order.waiter?.name || 'Server'} · {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.createdAt))}
                  </p>
                </div>
                <p className="text-gray-800 font-black text-lg">${order.totalAmount.toFixed(2)}</p>
              </div>
            ))}
            {(!stats.recentOrders || stats.recentOrders.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">No recent orders</div>
            )}
          </div>
        </div>

        {/* System Utilization - indigo/purple theme */}
        <div className="lg:col-span-3 rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-indigo-800 tracking-tight mb-2">System Utilization</h2>
              <p className="text-gray-600 font-medium">
                {stats.occupiedTables > 0
                  ? `${stats.occupiedTables} of ${stats.totalTables} tables occupied. ${stats.activeOrders} active orders.`
                  : `All ${stats.totalTables} tables are free. Ready for service.`}
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="text-center bg-white/60 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-sm border border-indigo-200">
                <p className="text-3xl font-black text-indigo-600">{stats.activeOrders}</p>
                <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-wider mt-1">Active</p>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-sm border border-indigo-200">
                <p className="text-3xl font-black text-indigo-600">{stats.totalTables - stats.occupiedTables}</p>
                <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-wider mt-1">Free</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}