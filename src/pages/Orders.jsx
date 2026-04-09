import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

const KITCHEN_STATUS_COLORS = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  ready:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-gray-50 text-gray-500 border-gray-200',
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

  // Kitchen readiness check
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

  const statusColors = { pending: 'text-blue-600 bg-blue-50', preparing: 'text-amber-600 bg-amber-50', ready: 'text-indigo-600 bg-indigo-50', served: 'text-indigo-600 bg-indigo-50', paid: 'text-emerald-600 bg-emerald-50', cancelled: 'text-rose-600 bg-rose-50' };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Table {order.table?.number} · {order.waiter?.name}
          </p>
          <p className="text-gray-500 text-xs">#{order._id.slice(-8).toUpperCase()}</p>
        </div>
        <span className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest ${statusColors[order.status] || 'text-gray-600 bg-gray-50'}`}>
          {order.status}
        </span>
      </div>



      {/* Items */}
      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-gray-900 font-bold text-sm">{item.name}</p>
              <p className="text-gray-400 text-[10px]">×{item.quantity} @ ${item.price.toFixed(2)}</p>
            </div>
            <p className="text-gray-900 font-black">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Bill breakdown */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span className="font-medium">Subtotal</span>
          <span className="font-bold">${subtotal.toFixed(2)}</span>
        </div>
        {order.status !== 'paid' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500 font-medium">Discount (%)</span>
            <input
              type="number" min="0" max="100"
              value={discount}
              onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-20 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-rose-500">
            <span>Discount ({discount}%)</span>
            <span className="font-bold">-${discountAmt.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tax ({taxRate}%)</span>
          <span className="font-bold">+${taxAmt.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-gray-900 font-black">Total</span>
          <span className="text-gray-900 font-black text-xl">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Status update */}
      {order.status !== 'paid' && order.status !== 'cancelled' && nextStatus && (
        <button
          onClick={handleStatusUpdate}
          disabled={statusUpdating}
          className="w-full border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-black py-3 rounded-2xl transition-all text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {statusUpdating ? 'Updating...' : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)} →`}
        </button>
      )}

      {/* Payment */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="space-y-3">
          {/* Kitchen busy warning */}
          {isKitchenBusy && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-amber-800 font-black text-xs uppercase tracking-widest mb-2">Kitchen still working</p>
                  <div className="space-y-1.5">
                    {busyKitchens.map((ko, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ko.kitchen?.displayColor || '#f59e0b' }}></div>
                          <span className="text-amber-700 text-xs font-bold">{ko.kitchen?.name || 'Kitchen'}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg tracking-widest
                          ${ko.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {ko.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!forcePayOverride ? (
                    <button
                      onClick={() => setForcePayOverride(true)}
                      className="mt-3 text-[10px] font-black text-amber-600 hover:text-amber-800 uppercase tracking-widest underline underline-offset-2"
                    >
                      Override & pay anyway →
                    </button>
                  ) : (
                    <p className="mt-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">⚡ Override active — payment unlocked</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {['cash', 'card', 'online'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                disabled={!canPay}
                className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  ${paymentMethod === method ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
              >
                {method === 'online' ? 'UPI' : method}
              </button>
            ))}
          </div>
          <button
            onClick={canPay ? handlePay : () => addToast('Kitchen is still working. Use "Override & pay anyway" to force payment.', 'warning')}
            disabled={submitting}
            className={`w-full font-black py-4 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-widest shadow-lg disabled:opacity-50
              ${canPay
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                : 'bg-amber-100 text-amber-500 cursor-not-allowed border-2 border-amber-200 shadow-none'}`}
          >
            {submitting ? 'Processing...' : canPay ? '✓ Mark as Paid' : '🔒 Kitchen Not Ready'}
          </button>
        </div>
      )}

      {order.status === 'paid' && (
        <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 p-4 rounded-2xl text-center">
          <p className="font-black text-sm uppercase tracking-widest">✓ Payment Received</p>
          <p className="text-emerald-500 text-xs mt-1 font-medium">via {order.paymentMethod?.toUpperCase()}</p>
        </div>
      )}

      {/* Cancel Order */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="pt-1">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full border-2 border-rose-200 text-rose-500 hover:bg-rose-50 font-black py-3 rounded-2xl transition-all text-xs uppercase tracking-widest"
            >
              ✕ Cancel Order
            </button>
          ) : (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 space-y-3">
              <p className="text-rose-800 font-black text-xs uppercase tracking-widest text-center">⚠ Confirm cancellation?</p>
              <p className="text-rose-600 text-[10px] text-center font-medium">This will cancel the order and free up the table. This cannot be undone.</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white transition-all disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 p-4 rounded-2xl text-center">
          <p className="font-black text-sm uppercase tracking-widest">✕ Order Cancelled</p>
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
  }, []);

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
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'preparing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'ready': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'pending': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'served': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const statuses = ['all', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  if (loading) return (
    <div className="flex items-center justify-center h-full p-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading orders...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Order Logs</h1>
          <p className="text-gray-500 font-medium mt-1">Order management + billing — print-to-kitchen workflow</p>
        </div>
        <button onClick={fetchOrders} className="text-xs font-black text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm self-start">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
              ${filterStatus === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-100/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Table</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waiter</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-gray-400 font-black font-mono text-[10px]">#{order._id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-900 font-black text-sm">T{order.table?.number || '?'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-600 font-bold text-sm">{order.waiter?.name || '—'}</span>
                  </td>
                  <td className="px-6 py-5">
                    {order.items?.length > 0 ? (
                      <div className="flex flex-col gap-1 max-w-[220px]">
                        {order.items.slice(0, 4).map((item, i) => {
                          // Determine veg/non-veg from kitchen type
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
                            <div key={i} className="flex items-center gap-1.5">
                              {/* Veg/Non-Veg dot indicator */}
                              <div className={`shrink-0 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center
                                ${isVeg ? 'border-emerald-500' : isNonVeg ? 'border-red-500' : 'border-gray-300'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full
                                  ${isVeg ? 'bg-emerald-500' : isNonVeg ? 'bg-red-500' : 'bg-gray-300'}`}>
                                </div>
                              </div>
                              <span className="text-gray-700 text-xs font-bold truncate">{item.name}</span>
                              <span className="shrink-0 text-gray-400 text-[10px] font-black">×{item.quantity}</span>
                            </div>
                          );
                        })}
                        {order.items.length > 4 && (
                          <span className="text-gray-400 text-[10px] font-black pl-5">
                            +{order.items.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-indigo-600 font-black font-mono">${order.totalAmount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl border tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-400 font-medium text-xs">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className={`text-xs font-black uppercase tracking-widest transition-colors px-3 py-1.5 rounded-xl
                        ${order.status === 'paid' ? 'text-gray-400 hover:text-gray-600 bg-gray-50' : 'text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 border border-indigo-100'}`}
                    >
                      {order.status === 'paid' ? 'View' : 'Bill →'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-24 text-center">
              <div className="text-5xl mb-4 opacity-30">📑</div>
              <p className="text-gray-400 font-bold">No {filterStatus === 'all' ? '' : filterStatus} orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Billing Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order Billing — Table ${selectedOrder?.table?.number || ''}`} size="md">
        <BillingModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPaid={handlePaid}
          onStatusUpdate={handleStatusUpdate}
        />
      </Modal>
    </div>
  );
}
