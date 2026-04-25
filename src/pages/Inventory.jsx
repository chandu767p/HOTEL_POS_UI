import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'logs'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustment, setAdjustment] = useState({ quantity: 0, type: 'in', reason: '' });
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      const [itemsRes, logsRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/logs')
      ]);
      setItems(itemsRes.data.data);
      setLogs(logsRes.data.data);
    } catch (err) {
      addToast('Failed to fetch inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/inventory/${selectedItem._id}`, adjustment);
      addToast('Stock adjusted successfully', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Inventory Management</h1>
        <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border">
          <button 
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-none ${activeTab === 'stock' ? 'bg-background text-brand-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
          >
            Stock Levels
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-none ${activeTab === 'logs' ? 'bg-background text-brand-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
          >
            History Logs
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <div key={item._id} className={`card p-6 border-t-2 ${item.stock < item.threshold ? 'border-brand-danger' : 'border-brand-primary'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">{item.name}</h3>
                <span className={`badge text-[9px] ${item.stock < item.threshold ? 'status-red' : 'status-green'}`}>
                  {item.stock < item.threshold ? 'LOW STOCK' : 'IN STOCK'}
                </span>
              </div>
              <p className="text-3xl font-bold text-text-primary tracking-tight">
                {item.stock} <span className="text-xs text-text-muted font-medium">{item.unit}</span>
              </p>
              <p className="text-[10px] text-text-muted font-bold uppercase mt-1">Threshold: {item.threshold} {item.unit}</p>
              <button 
                onClick={() => { setSelectedItem(item); setAdjustment({ quantity: 0, type: 'in', reason: '' }); setIsModalOpen(true); }}
                className="mt-6 w-full btn-secondary py-2 text-[10px] uppercase font-bold tracking-wider"
              >
                Adjust Stock
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table-minimal">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Change</th>
                <th>Final Stock</th>
                <th>Reason</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td className="text-[11px] text-text-muted">
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="font-bold text-text-primary text-xs uppercase">{log.inventoryItem?.name}</td>
                  <td>
                    <span className={`badge text-[10px] ${log.type === 'in' ? 'status-green' : log.type === 'out' ? 'status-red' : 'status-blue'}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className={`font-bold text-xs ${log.type === 'in' ? 'text-brand-success' : 'text-brand-danger'}`}>
                    {log.type === 'in' ? '+' : '-'}{log.quantity}
                  </td>
                  <td className="font-bold text-xs text-text-primary">{log.newStock} {log.inventoryItem?.unit}</td>
                  <td className="text-[11px] text-text-muted uppercase">{log.reason}</td>
                  <td className="text-[11px] text-text-muted">{log.user?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adjust Stock: ${selectedItem?.name}`}>
        <form onSubmit={handleAdjust} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Adjustment Type</label>
              <select 
                className="form-input"
                value={adjustment.type}
                onChange={e => setAdjustment({...adjustment, type: e.target.value})}
              >
                <option value="in">Restock (+)</option>
                <option value="out">Consumption (-)</option>
                <option value="adjustment">Manual Override (=)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Quantity ({selectedItem?.unit})</label>
              <input 
                type="number"
                className="form-input"
                value={adjustment.quantity}
                onChange={e => setAdjustment({...adjustment, quantity: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Reason / Reference</label>
            <input 
              className="form-input"
              value={adjustment.reason}
              onChange={e => setAdjustment({...adjustment, reason: e.target.value})}
              placeholder="e.g. New delivery, Wastage"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3">Update Inventory</button>
        </form>
      </Modal>
    </div>
  );
}
