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
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: '💰', color: 'text-brand-success', bg: 'bg-brand-success/5', border: 'border-brand-success/10' },
    { label: 'Orders', value: orders.length, icon: '📋', color: 'text-brand-info', bg: 'bg-brand-info/5', border: 'border-brand-info/10' },
    { label: 'Avg Order', value: `$${avgOrderValue.toFixed(2)}`, icon: '📈', color: 'text-brand-primary', bg: 'bg-brand-primary/5', border: 'border-brand-primary/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Business Reports</h1>
          <p className="text-text-muted text-xs mt-1">Operational performance metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="form-input py-2 text-xs"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              className="form-input py-2 text-xs"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <button
            onClick={fetchReports}
            className="btn-secondary px-4 py-2 text-[11px] font-bold uppercase tracking-wider"
          >
            Update
          </button>
          <button
            onClick={exportCSV}
            disabled={orders.length === 0}
            className="btn-primary px-4 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
          >
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`card p-6 border-t-2 ${s.border.replace('border-', 'border-t-')}`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg.replace('/5', '/10')} flex items-center justify-center text-base`}>
                {s.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary tracking-tight">{s.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-1 h-1 rounded-full ${s.color.replace('text-', 'bg-')}`}></div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Historical Performance</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Best Sellers */}
        <div className="lg:col-span-1 card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface/50">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest">Best Selling Items</h2>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="py-12 text-center text-text-muted text-xs font-semibold uppercase">Analyzing...</div>
            ) : bestSellers.length > 0 ? (
              <div className="space-y-1">
                {bestSellers.map((item, i) => (
                  <div key={item._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-none group">
                    <div className="w-7 h-7 rounded bg-background border border-border flex items-center justify-center text-text-muted font-bold text-[11px] group-hover:text-brand-primary group-hover:border-brand-primary transition-none">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-semibold text-text-muted uppercase mt-0.5">{item.totalSold} sold</p>
                    </div>
                    <p className="text-sm font-bold text-text-primary tracking-tight">${item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-muted text-xs font-semibold uppercase">No data</div>
            )}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface/50">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-widest">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-minimal">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Table</th>
                  <th>Waiter</th>
                  <th>Time</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-text-muted text-xs font-semibold uppercase">Fetching records...</td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o._id} className="group">
                      <td>
                        <span className="text-[11px] font-mono font-bold text-text-muted group-hover:text-brand-primary">#{o._id.toString().slice(-6).toUpperCase()}</span>
                      </td>
                      <td>
                        <span className="text-xs font-bold text-text-primary uppercase tracking-tight">Table {o.table?.number || '??'}</span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-text-muted uppercase">{o.waiter?.name}</span>
                      </td>
                      <td>
                        <span className="text-[11px] font-bold text-text-muted uppercase">
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-text-primary tracking-tight">${o.totalAmount.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className={`badge text-[10px] ${o.status === 'paid' ? 'status-green' :
                            o.status === 'cancelled' ? 'status-red' : 'status-blue'
                          }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-text-muted text-xs font-semibold uppercase">No records found</td>
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
