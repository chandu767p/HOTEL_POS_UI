import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
      const [statsRes, bestSellersRes, recentOrdersRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/best-sellers'),
        api.get('/orders?limit=5')
      ]);

      const statsData = statsRes.data;

      setStats({
        totalSales: statsData.totalSales,
        activeOrders: statsData.activeOrders,
        occupiedTables: statsData.occupiedTables,
        totalTables: statsData.totalTables,
        avgOrderVal: statsData.avgOrderVal,
        popularItems: bestSellersRes.data.data,
        recentOrders: recentOrdersRes.data.data || []
      });
    } catch (err) {
      addToast('System link failure: Dashboard data inaccessible', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { label: "Today's Sales", value: `$${stats.totalSales.toFixed(2)}`, trend: '+ $743', color: 'bg-brand-success', icon: '💰' },
    { label: 'Orders (Today)', value: '389', trend: '32 Served', color: 'bg-brand-primary', icon: '🍽️' },
    { label: 'Pending Orders', value: stats.activeOrders, trend: '11 Active', color: 'bg-brand-info', icon: '⏳' },
    { label: 'Customers', value: '265', trend: '12 New', color: 'bg-brand-warning', icon: '👥' },
    { label: 'Staff Online', value: '14', trend: '2 Break', color: 'bg-brand-info', icon: '👔' },
    { label: 'Active Tables', value: `${stats.occupiedTables}`, trend: `${stats.totalTables - stats.occupiedTables} Free`, color: 'bg-brand-primary', icon: '🪑' },
  ];

  const getCardColor = (colorClass) => {
    const map = {
      'bg-brand-success': { border: 'border-t-brand-success', bg: 'bg-brand-success/10', text: 'text-brand-success' },
      'bg-brand-primary': { border: 'border-t-brand-primary', bg: 'bg-brand-primary/10', text: 'text-brand-primary' },
      'bg-brand-info': { border: 'border-t-brand-info', bg: 'bg-brand-info/10', text: 'text-brand-info' },
      'bg-brand-warning': { border: 'border-t-brand-warning', bg: 'bg-brand-warning/10', text: 'text-brand-warning' },
    };
    return map[colorClass] || map['bg-brand-primary'];
  };

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-background min-h-[80vh]">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-text-muted text-xs mt-1">Operational performance and live monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-success"></div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-tight">Live</span>
          </div>
          <button
            onClick={() => window.location.href = '/order/walkin'}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-md hover:bg-brand-primary hover:text-white transition-none text-[11px] font-bold uppercase tracking-wider"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Walk-in
          </button>
          <button onClick={fetchDashboardStats} className="btn-secondary p-2 group rounded-md">
            <svg className="w-4 h-4 text-text-muted group-hover:text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => {
          const colors = getCardColor(card.color);
          return (
            <div
              key={i}
              className={`card p-5 border-t-2 ${colors.border} transition-all cursor-default hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center text-base`}>
                  {card.icon}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-text-primary tracking-tight">{card.value}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${card.color}`}></div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{card.trend}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Graph + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Sales Volume</h3>
              <p className="text-xs text-text-muted mt-0.5">Order variance over the selected period</p>
            </div>
            <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
              {['7d', '30d', '1y'].map(f => (
                <button key={f} className={`px-3 py-1 rounded text-[11px] font-semibold transition-none ${f === '7d' ? 'bg-surface text-text-primary border border-border' : 'text-text-muted hover:text-text-secondary'}`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[250px] flex items-end gap-2.5 px-2">
            {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-primary/20 hover:bg-brand-primary/40 rounded-t-sm transition-none" style={{ height: `${h}%` }}></div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <span key={day} className="text-[10px] font-medium text-text-muted uppercase">{day}</span>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Distribution</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border" />
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-brand-success" strokeDasharray="251.2" strokeDashoffset="100" />
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-brand-primary" strokeDasharray="251.2" strokeDashoffset="180" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-text-primary tracking-tighter">1,289</p>
                <p className="text-[10px] font-medium text-text-muted uppercase">Total</p>
              </div>
            </div>
            <div className="w-full space-y-3">
              {[
                { label: 'Sales', val: '40%', color: 'bg-brand-success' },
                { label: 'Orders', val: '35%', color: 'bg-brand-primary' },
                { label: 'Customers', val: '25%', color: 'bg-brand-warning' }
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-sm ${item.color}`}></div>
                    <span className="text-xs font-medium text-text-secondary">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-text-primary">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Block 1: Sales Small Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Hourly Performance</h4>
            <span className="text-xs font-bold text-brand-success">+12%</span>
          </div>
          <div className="h-16 flex items-end gap-1 px-1">
            {[30, 50, 40, 70, 60, 80, 55, 45, 90, 65].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-info/20 rounded-sm" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        {/* Block 2: Key Metrics */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Key Metrics</h4>
            <button className="text-[10px] font-bold text-brand-primary hover:underline">REPORTS</button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Revenue', val: '$16.4k' },
              { label: 'AOV', val: '$42.50' },
              { label: 'Voided', val: '14' },
              { label: 'Capacity', val: '85%' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <span className="text-[11px] font-medium text-text-muted uppercase">{item.label}</span>
                <span className="text-xs font-semibold text-text-secondary">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Block 3: Staff Logs */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Staff Activity</h4>
            <div className="w-1.5 h-1.5 rounded-full bg-brand-success"></div>
          </div>
          <div className="space-y-4">
            {[
              { name: 'James P.', task: 'Checkout T-12', time: '2m' },
              { name: 'Sarah W.', task: 'New Order T-05', time: '5m' },
              { name: 'David B.', task: 'Voided Item', time: '12m' }
            ].map(staff => (
              <div key={staff.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-[11px] font-bold text-text-muted">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-secondary truncate">{staff.name}</p>
                  <p className="text-[10px] text-text-muted truncate uppercase tracking-tight">{staff.task}</p>
                </div>
                <span className="text-[10px] font-medium text-text-muted">{staff.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Block 4: Top Sellers */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Top Sellers</h4>
            <button className="text-[10px] font-bold text-brand-primary hover:underline">MENU</button>
          </div>
          <div className="space-y-3.5">
            {stats.popularItems.slice(0, 3).map((item, i) => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-xs font-bold text-text-muted">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-secondary truncate">{item.name}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-tight">{item.totalSold} Sold</p>
                </div>
                <p className="text-xs font-bold text-text-primary tracking-tight">${item.revenue?.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}