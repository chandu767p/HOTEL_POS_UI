import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const KITCHEN_STATUS_CLASSES = {
  pending: 'status-orange',
  preparing: 'status-blue',
  ready: 'status-green',
  completed: 'bg-border/50 text-text-muted',
};

const ORDER_STATUS_CLASSES = {
  pending: 'status-orange',
  preparing: 'status-blue',
  ready: 'status-blue',
  served: 'status-purple',
  paid: 'status-green',
  cancelled: 'status-red',
};

const STATUS_FLOW = ['pending', 'preparing', 'served'];

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
      addToast(`Status: ${nextStatus}`, 'success');
      onStatusUpdate(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePay = async () => {
    if (!paymentMethod) return addToast('Select payment method', 'warning');
    setSubmitting(true);
    try {
      if (paymentMethod === 'online') {
        const res = await loadRazorpay();
        if (!res) return addToast('Razorpay SDK failed to load. Are you online?', 'error');

        // Create order on backend
        const { data: { rzpOrder } } = await api.post(`/orders/${order._id}/razorpay-order`);

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "AJARK POS",
          description: `Order #${order._id.slice(-6).toUpperCase()}`,
          order_id: rzpOrder.id,
          handler: async (response) => {
            try {
              await api.post(`/orders/${order._id}/razorpay-verify`, response);
              addToast('Payment successful!', 'success');
              onPaid();
            } catch (err) {
              addToast(err.message || 'Payment verification failed', 'error');
            }
          },
          prefill: {
            name: order.waiter?.name || 'Customer',
            email: "pos@edensoft.com",
          },
          theme: { color: "#3B82F6" },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } else {
        await api.post(`/orders/${order._id}/pay`, { paymentMethod, discount, tax: taxRate });
        addToast('Payment settled', 'success');
        onPaid();
      }
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
      addToast('Order cancelled', 'success');
      onCancelled(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-semibold text-sm truncate uppercase tracking-tight">{item.name}</p>
              <p className="text-text-muted text-[11px] font-medium uppercase mt-0.5">{item.quantity} × ${item.price.toFixed(2)}</p>
            </div>
            <p className="text-text-primary font-bold text-sm ml-4 tracking-tight">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Bill breakdown */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-3.5">
        <div className="flex justify-between text-xs font-medium text-text-muted">
          <span>Subtotal</span>
          <span className="text-text-secondary">${subtotal.toFixed(2)}</span>
        </div>

        {order.status !== 'paid' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-text-muted">Discount (%)</span>
            <input
              type="number" min="0" max="100"
              value={discount}
              onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-20 bg-surface border border-border rounded-md px-2 py-1 text-xs font-bold text-right text-brand-primary focus:outline-none focus:border-brand-primary"
            />
          </div>
        )}

        <div className="flex justify-between text-xs font-medium text-text-muted">
          <span>Tax ({taxRate}%)</span>
          <span className="text-text-secondary">+${taxAmt.toFixed(2)}</span>
        </div>

        <div className="flex justify-between pt-4 border-t border-border">
          <span className="text-text-primary font-semibold text-sm">Grand Total</span>
          <span className="text-text-primary font-bold text-2xl tracking-tighter">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Area */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="space-y-4">
          {nextStatus && (
            <button
              onClick={handleStatusUpdate}
              disabled={statusUpdating}
              className="w-full btn-secondary py-3 text-xs uppercase tracking-wider"
            >
              {statusUpdating ? 'Updating...' : `Advance to ${nextStatus}`}
            </button>
          )}

          {isKitchenBusy && (
            <div className="bg-brand-warning/5 border border-brand-warning/20 rounded-lg p-3.5">
              <p className="text-brand-warning font-bold text-[11px] uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-warning"></span>
                Kitchen Working
              </p>
              <div className="space-y-1.5">
                {busyKitchens.map((ko, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">{ko.kitchen?.name || 'Kitchen'}</span>
                    <span className={`font-bold uppercase ${ko.status === 'pending' ? 'text-brand-warning' : 'text-brand-primary'}`}>{ko.status}</span>
                  </div>
                ))}
              </div>
              {!forcePayOverride && (
                <button
                  onClick={() => setForcePayOverride(true)}
                  className="mt-3 text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-tight"
                >
                  Override Protection →
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-1">Settlement Method</p>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'card', 'online'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  disabled={!canPay}
                  className={`py-2.5 rounded-md text-[10px] font-bold uppercase tracking-wide border transition-none
                    ${paymentMethod === method
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-surface text-text-muted border-border hover:border-text-muted'}`}
                >
                  {method === 'online' ? 'UPI' : method}
                </button>
              ))}
            </div>
            <button
              onClick={handlePay}
              disabled={submitting || !canPay}
              className={`w-full py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-none
                ${canPay ? 'bg-brand-success text-white' : 'bg-border text-text-muted cursor-not-allowed'}`}
            >
              {submitting ? 'Processing...' : 'Settle Bill'}
            </button>
          </div>
        </div>
      )}

      {/* Completion Status */}
      {(order.status === 'paid' || order.status === 'cancelled') && (
        <div className={`rounded-lg p-4 text-center border ${order.status === 'paid' ? 'status-green' : 'status-red'}`}>
          <p className="font-bold text-xs uppercase tracking-widest">
            {order.status === 'paid' ? 'Payment Received' : 'Order Voided'}
          </p>
          {order.status === 'paid' && (
            <p className="text-text-muted text-[10px] mt-1 uppercase tracking-tight">Method: {order.paymentMethod}</p>
          )}
        </div>
      )}

      {/* Cancel Action */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="pt-2">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full text-text-muted hover:text-brand-danger text-[10px] font-bold uppercase tracking-wider"
            >
              Void Order
            </button>
          ) : (
            <div className="bg-brand-danger/5 border border-brand-danger/20 rounded-lg p-4 space-y-4">
              <p className="text-brand-danger font-bold text-[11px] text-center uppercase">Void this order?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 btn-secondary py-2 text-[10px]"
                >
                  No
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-brand-danger text-white py-2 rounded-md text-[10px] font-bold uppercase"
                >
                  {cancelling ? '...' : 'Yes, Void'}
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

  const statuses = ['all', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh] bg-background">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Billing & Orders</h1>
          <p className="text-text-muted text-xs mt-1">
            {orders.filter(o => !['paid', 'cancelled'].includes(o.status)).length} active transactions
          </p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary p-2.5 rounded-lg group">
          <svg className="w-4 h-4 text-text-muted group-hover:text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap bg-surface p-1.5 border border-border rounded-xl">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-none
              ${filterStatus === s
                ? 'bg-background text-text-primary border border-border shadow-subtle'
                : 'text-text-muted hover:text-text-secondary'}`}>
            {s} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table-minimal">
            <thead>
              <tr>
                <th>ID</th>
                <th>Waiter / Table</th>
                <th>Status</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Time</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <span className="font-mono text-[11px] font-medium text-text-muted">#{order._id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-[10px] font-bold text-text-muted">
                         {order.waiter?.name?.split(' ').map(n => n[0]).join('') || 'W'}
                      </div>
                      <div>
                        <p className="text-text-secondary font-semibold text-[13px] leading-tight">{order.waiter?.name || 'Walk-in'}</p>
                        <p className="text-text-muted text-[10px] font-medium uppercase tracking-tight">{order.table?.number ? `Table ${order.table.number}` : 'Walk-in'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${ORDER_STATUS_CLASSES[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-text-secondary text-xs font-medium">
                      {order.items?.length || 0} items
                    </span>
                  </td>
                  <td>
                    <span className="text-text-primary font-bold text-sm tracking-tight">${order.totalAmount.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className="text-text-muted text-[11px] font-medium uppercase">
                      {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.createdAt))}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-none
                          ${order.status === 'paid' ? 'btn-secondary' : 'bg-brand-success text-white hover:bg-brand-success/90'}`}
                      >
                        {order.status === 'paid' ? 'View' : 'Bill'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-text-muted font-medium uppercase tracking-widest text-xs">No orders match criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Billing Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?._id.slice(-6).toUpperCase()}`} size="md">
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

