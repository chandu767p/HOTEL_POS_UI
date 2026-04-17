import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { addToast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: `${dateRange.endDate}T23:59:59.999Z`
      };
      
      const [ordersRes, bestSellersRes] = await Promise.all([
        api.get('/orders', { params }),
        api.get('/orders/best-sellers', { params: { ...params, limit: 10 } })
      ]);
      
      setOrders(ordersRes.data);
      setBestSellers(bestSellersRes.data);
    } catch (err) {
      addToast('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => o.status === 'paid' ? sum + o.totalAmount : sum, 0);
  const paidOrders = orders.filter(o => o.status === 'paid');
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  const exportCSV = () => {
    const headers = ['Order ID', 'Date', 'Time', 'Table', 'Waiter', 'Total Amount', 'Status', 'Payment Method'];
    
    const rows = orders.map(o => {
      const dateObj = new Date(o.createdAt);
      return [
        o._id.toString().slice(-6).toUpperCase(),
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        o.table?.number || 'N/A',
        o.waiter?.name || 'N/A',
        o.totalAmount.toFixed(2),
        o.status,
        o.paymentMethod || 'N/A'
      ].map(val => `"${val}"`); // Wrap in quotes to handle any commas in values
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.map(h => `"${h}"`), ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Orders', value: orders.length, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg. Order Value', value: `$${avgOrderValue.toFixed(2)}`, icon: '📈', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 bg-white h-full min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Sales Reports</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Generate and export performance data</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">From Date</label>
            <input 
              type="date" 
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">To Date</label>
            <input 
              type="date" 
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
          <button 
            onClick={fetchReports}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
          >
            Generate
          </button>
          <button 
            onClick={exportCSV}
            disabled={orders.length === 0}
            className="px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`p-6 rounded-2xl border border-slate-100 ${s.bg} border shadow-sm`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-black ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Top Performers & Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Top 10 Best Sellers */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="text-xl">🏆</span> Top 10 Performers
            </h2>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading stats...</div>
            ) : bestSellers.length > 0 ? (
              <div className="space-y-1">
                {bestSellers.map((item, i) => (
                  <div key={item._id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-brand-primary group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">{item.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.totalSold} sold</p>
                    </div>
                    <p className="text-sm font-black text-slate-800">${item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">No data found</div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-lg font-black text-slate-800">Order Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Table</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiter</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm font-medium">Loading report data...</td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-400 uppercase">#{o._id.toString().slice(-6)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700">Table {o.table?.number || '??'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{o.waiter?.name}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-800">${o.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                          o.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm font-medium">No orders found for the selected range</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
