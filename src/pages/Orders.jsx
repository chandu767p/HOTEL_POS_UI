import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const KITCHEN_STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  preparing: 'bg-blue-50 text-blue-600 border-blue-100',
  ready: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  completed: 'bg-slate-50 text-slate-400 border-slate-100',
};

const STATUS_FLOW = ['pending', 'preparing', 'served'];

function BillingModal({ order, onClose, onPaid, onStatusUpdate, onCancelled }) {
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [forcePayOverride, setForcePayOverride] = useState(false);
  const { addToast } = useToast();

  if (!order) return null;

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = (subtotal * discount) / 100;
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const currentStatusIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = STATUS_FLOW[currentStatusIdx + 1];

  const busyKitchens = (order.kitchenOrders || []).filter(
    ko => ko.status === 'pending' || ko.status === 'preparing'
  );
  const isKitchenBusy = busyKitchens.length > 0;
  const canPay = !isKitchenBusy || forcePayOverride;

  const handleStatusUpdate = async () => {
    if (!nextStatus) return;
    setStatusUpdating(true);
    try {
      const res = await api.put(`/orders/${order._id}/status`, { status: nextStatus });
      addToast(`Status → ${nextStatus}`, 'success');
      onStatusUpdate(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePay = async () => {
    if (!paymentMethod) return addToast('Select a payment method', 'warning');
    setSubmitting(true);
    try {
      await api.post(`/orders/${order._id}/pay`, { paymentMethod, discount, tax: taxRate });
      addToast('Payment received! Table is now available.', 'success');
      onPaid();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.put(`/orders/${order._id}/status`, { status: 'cancelled' });
      addToast('Order cancelled successfully.', 'success');
      onCancelled(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  const statusColors = {
    pending: 'bg-blue-50 text-blue-700 border-blue-100',
    preparing: 'bg-amber-50 text-amber-700 border-amber-100',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    served: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-100'
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <p className="text-[20px] font-bold text-gray-900 tracking-wider">
        Items
      </p>


      {/* Items */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0 group">
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-bold text-sm group-hover:text-blue-600 transition-colors truncate">{item.name}</p>
              <p className="text-gray-400 text-[11px] font-semibold mt-0.5">×{item.quantity} · ${item.price.toFixed(2)} ea</p>
            </div>
            <p className="text-gray-800 font-black text-sm ml-4">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Bill breakdown */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 space-y-3">
        <div className="flex justify-between text-[11px] font-bold uppercase text-gray-500">
          <span>Subtotal</span>
          <span className="text-gray-800">${subtotal.toFixed(2)}</span>
        </div>

        {order.status !== 'paid' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-bold uppercase text-gray-500">Discount (%)</span>
            <input
              type="number" min="0" max="100"
              value={discount}
              onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-black text-right text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-[11px] font-bold uppercase text-rose-500">
            <span>Discount Applied</span>
            <span>-${discountAmt.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-[11px] font-bold uppercase text-gray-500">
          <span>Tax ({taxRate}%)</span>
          <span className="text-gray-800">+${taxAmt.toFixed(2)}</span>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <span className="text-gray-500 text-xs font-bold uppercase">Grand Total</span>
          <span className="text-gray-900 font-black text-2xl">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Status update */}
      {order.status !== 'paid' && order.status !== 'cancelled' && nextStatus && (
        <button
          onClick={handleStatusUpdate}
          disabled={statusUpdating}
          className="w-full bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider disabled:opacity-50"
        >
          {statusUpdating ? 'Updating...' : `Mark as ${nextStatus} →`}
        </button>
      )}

      {/* Payment */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="space-y-5">
          {isKitchenBusy && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-amber-700 font-bold text-[10px] uppercase tracking-wider">Kitchen Still Busy</p>
                  </div>
                  <div className="space-y-2 pl-4 border-l border-amber-200">
                    {busyKitchens.map((ko, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ko.kitchen?.displayColor || '#f59e0b' }}></div>
                          <span className="text-gray-700 text-xs font-medium">{ko.kitchen?.name || 'Kitchen'}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border
                          ${ko.status === 'pending' ? 'border-amber-200 text-amber-700 bg-amber-100' : 'border-blue-200 text-blue-700 bg-blue-100'}`}>
                          {ko.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!forcePayOverride ? (
                    <button
                      onClick={() => setForcePayOverride(true)}
                      className="mt-3 text-[10px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wider"
                    >
                      Override & Pay Anyway →
                    </button>
                  ) : (
                    <p className="mt-3 text-[10px] font-bold text-amber-600 uppercase tracking-wider">Override Active — Ready to Collect</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'card', 'online'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  disabled={!canPay}
                  className={`py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 border
                    ${paymentMethod === method
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'}`}
                >
                  {method === 'online' ? 'UPI' : method}
                </button>
              ))}
            </div>
            <button
              onClick={canPay ? handlePay : () => addToast('Kitchen is still busy. Use "Override & Pay Anyway" to proceed.', 'warning')}
              disabled={submitting}
              className={`w-full mt-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                ${canPay ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
            >
              {submitting ? 'Processing...' : canPay ? '✓ Collect Payment' : 'Kitchen Busy'}
            </button>
          </div>
        </div>
      )}

      {/* Completion Status */}
      {(order.status === 'paid' || order.status === 'cancelled') && (
        <div className={`rounded-xl p-5 text-center border ${order.status === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <p className={`font-bold text-xs uppercase tracking-wider ${order.status === 'paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
            Order {order.status === 'paid' ? 'Paid' : 'Cancelled'}
          </p>
          {order.status === 'paid' && (
            <p className="text-gray-500 text-xs mt-1">Paid via {order.paymentMethod?.toUpperCase()}</p>
          )}
        </div>
      )}

      {/* Cancel Order */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="pt-2">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full text-gray-400 hover:text-rose-500 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel Order
            </button>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-4">
              <p className="text-rose-700 font-bold text-xs text-center uppercase">⚠ Cancel this order?</p>
              <p className="text-gray-600 text-xs text-center">This will cancel the order and free up the table. This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handlePaid = () => {
    setSelectedOrder(null);
    fetchOrders();
  };

  const handleStatusUpdate = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10';
      case 'preparing': return 'bg-amber-500/10 text-amber-400 border-amber-500/10';
      case 'ready': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/10';
      case 'pending': return 'bg-blue-500/10 text-blue-400 border-blue-500/10';
      case 'served': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/10';
      case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/10';
      default: return 'bg-white/5 text-brand-secondary border-white/5';
    }
  };

  const statuses = ['all', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  if (loading) return (
    <div className="flex items-center justify-center p-32">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Orders</h1>
          <p className="text-slate-400 text-sm mt-3 font-semibold uppercase tracking-wider">Track and manage all active and completed orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary group p-4 border-slate-200">
          <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700 text-slate-400 group-hover:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2.5 flex-wrap mb-10 pb-2 overflow-x-auto custom-scrollbar">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border
              ${filterStatus === s
                ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 shadow-sm'}`}>
            {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden border-slate-200 shadow-xl shadow-slate-200/20">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Order ID</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Table</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Waiter</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Items</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Total</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Time</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-7">
                    <span className="text-slate-300 font-mono text-[11px] font-bold transition-colors group-hover:text-brand-primary">#{order._id.slice(-8).toUpperCase()}</span>
                  </td>
                  <td className="px-8 py-7">
                    <span className="text-slate-900 font-black text-base tracking-tight">Table {order.table?.number || '?'}</span>
                  </td>
                  <td className="px-8 py-7">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">{order.waiter?.name || 'SYSTEM'}</span>
                  </td>
                  <td className="px-8 py-7">
                    {order.items?.length > 0 ? (
                      <div className="flex flex-col gap-2 max-w-[280px]">
                        {order.items.slice(0, 2).map((item, i) => {
                          const kitchenType = item.kitchen?.type ||
                            order.kitchenOrders?.find(ko =>
                              ko.items?.some(ki =>
                                (ki.menuItem?._id || ki.menuItem)?.toString() ===
                                (item.menuItem?._id || item.menuItem)?.toString()
                              )
                            )?.kitchen?.type;
                          const isVeg = kitchenType === 'veg' || kitchenType === 'dessert';
                          const isNonVeg = kitchenType === 'non-veg' || kitchenType === 'bar';
                          return (
                            <div key={i} className="flex items-center gap-2.5">
                              <div className={`shrink-0 w-2 h-2 rounded-full border border-slate-100
                                ${isVeg ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : isNonVeg ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-slate-200'}`}>
                              </div>
                              <span className="text-slate-600 text-[13px] font-bold truncate group-hover:text-slate-900">{item.name}</span>
                              <span className="shrink-0 text-slate-400 text-[11px] font-black ml-auto opacity-40 group-hover:opacity-100">×{item.quantity}</span>
                            </div>
                          );
                        })}
                        {order.items.length > 2 && (
                          <span className="text-slate-400 text-[11px] font-bold pl-5 italic opacity-60 group-hover:opacity-100 transition-opacity">
                            + {order.items.length - 2} more items
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">— No Items —</span>
                    )}
                  </td>
                  <td className="px-8 py-7">
                    <span className="text-slate-900 font-black text-xl tracking-tighter">${order.totalAmount.toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-7">
                    <span className={`badge border font-black ${getStatusColor(order.status)} pb-1`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-7">
                    <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                      {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(order.createdAt))}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 px-6 py-3 rounded-xl border
                        ${order.status === 'paid' ? 'bg-slate-50 text-slate-500 hover:text-slate-900 border-slate-100 hover:border-slate-300' : 'bg-brand-primary/5 text-brand-primary border-brand-primary/10 hover:bg-brand-primary hover:text-white shadow-sm hover:shadow-lg hover:shadow-brand-primary/20'}`}
                    >
                      {order.status === 'paid' ? 'View' : 'Bill'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-40 text-center bg-slate-50/30">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Billing Modal Overlay */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Bill — Table ${selectedOrder?.table?.number || ''}`} size="md">
        <BillingModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPaid={handlePaid}
          onStatusUpdate={handleStatusUpdate}
          onCancelled={handlePaid}
        />
      </Modal>
    </div>
  );
}
