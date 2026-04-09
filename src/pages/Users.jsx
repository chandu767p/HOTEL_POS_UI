import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

const ROLES = ['waiter', 'chef', 'manager', 'admin'];
const ROLE_BADGES = {
  admin: 'bg-rose-50 text-rose-600 border-rose-200',
  manager: 'bg-amber-50 text-amber-600 border-amber-200',
  chef: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  waiter: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

const defaultForm = { name: '', email: '', password: '', role: 'waiter' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      // Backend returns { success, data, pagination }
      setUsers(res.data.data || res.data.users || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => {
    setForm(defaultForm);
    setModal({ open: true, editing: null });
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setModal({ open: true, editing: user });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return addToast('Name is required', 'warning');
    if (!form.email.trim()) return addToast('Email is required', 'warning');
    if (!modal.editing && !form.password) return addToast('Password is required for new workers', 'warning');
    if (!modal.editing && form.password.length < 6) return addToast('Password must be at least 6 characters', 'warning');

    setSubmitting(true);
    try {
      if (modal.editing) {
        // Update — don't send empty password
        const updates = { name: form.name, email: form.email, role: form.role };
        await api.put(`/users/${modal.editing._id}`, updates);
        addToast('Worker updated successfully', 'success');
      } else {
        // Create via auth/register so password gets hashed
        await api.post('/auth/register', form);
        addToast('Worker onboarded successfully', 'success');
      }
      setModal({ open: false, editing: null });
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { active: !user.active });
      addToast(`${user.name} has been ${!user.active ? 'activated' : 'deactivated'}`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Remove ${user.name} from the system? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      addToast(`${user.name} removed`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  if (loading) return (
    <div className="flex items-center justify-center h-full p-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading staff records...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 font-medium mt-1">{users.length} workers registered in the system</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95 self-start"
        >
          + Onboard New Worker
        </button>
      </div>

      {/* Role summary badges */}
      <div className="flex gap-3 flex-wrap mb-8">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${ROLE_BADGES[role]}`}>
              {role}: {count}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-100/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Worker</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-200">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 font-black text-sm">{user.name}</p>
                        <p className="text-gray-400 text-[10px] font-bold">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-500 font-bold text-sm">{user.email}</td>
                  <td className="px-6 py-5">
                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border tracking-widest ${ROLE_BADGES[user.role] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                        ${user.active
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                      {user.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(user)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all uppercase tracking-widest"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black text-gray-400 bg-gray-50 hover:bg-rose-500 hover:text-white border border-gray-100 hover:border-rose-500 transition-all uppercase tracking-widest"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-24 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-400 font-bold text-lg mb-2">No workers registered yet</p>
              <button onClick={openAdd} className="text-indigo-600 font-black text-sm hover:text-indigo-800 uppercase tracking-widest">
                Onboard First Worker →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? `Edit — ${modal.editing.name}` : 'Onboard New Worker'}
      >
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name *</label>
            <input
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. John Smith"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address *</label>
            <input
              type="email"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
              value={form.email}
              onChange={set('email')}
              placeholder="john@ajark.com"
              required
            />
          </div>

          {!modal.editing && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password *</label>
              <input
                type="password"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
                value={form.password}
                onChange={set('password')}
                placeholder="Min 6 characters"
                required={!modal.editing}
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Operations Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role }))}
                  className={`py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-left
                    ${form.role === role
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                >
                  {role === 'admin' && '🔑 '}
                  {role === 'manager' && '📋 '}
                  {role === 'chef' && '👨‍🍳 '}
                  {role === 'waiter' && '🛎️ '}
                  {role}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={submitting}
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 disabled:opacity-50 mt-2"
          >
            {submitting
              ? 'Saving...'
              : modal.editing
                ? 'Update Worker'
                : 'Onboard Worker'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
