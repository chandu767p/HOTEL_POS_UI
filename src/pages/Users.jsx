import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ROLES = ['waiter', 'chef', 'manager', 'admin'];
const ROLE_BADGES = {
  admin: 'bg-rose-500/10 text-rose-400 border-rose-500/10',
  manager: 'bg-amber-500/10 text-amber-400 border-amber-500/10',
  chef: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10',
  waiter: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10',
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
      setUsers(res.data.data || res.data.users || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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
        const updates = { name: form.name, email: form.email, role: form.role };
        await api.put(`/users/${modal.editing._id}`, updates);
        addToast('Staff member updated', 'success');
      } else {
        await api.post('/auth/register', form);
        addToast('Staff member added', 'success');
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
      addToast(`${user.name} state changed to ${!user.active ? 'Active' : 'Standby'}`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Remove ${user.name} from the system?`)) return;
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
    <div className="flex items-center justify-center p-32">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Staff</h1>
          <p className="text-slate-400 text-sm mt-3 font-semibold uppercase tracking-wider">{users.length} staff members</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary py-4 px-8 text-xs font-bold uppercase tracking-widest"
        >
          Add Staff Member
        </button>
      </div>

      {/* Role summary badges */}
      <div className="flex gap-3 flex-wrap mb-10">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length;
          const roleStyles = {
            admin: 'bg-rose-50 text-rose-600 border-rose-100',
            manager: 'bg-amber-50 text-amber-600 border-amber-100',
            chef: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            waiter: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          };
          return (
            <div key={role} className={`px-5 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest shadow-sm ${roleStyles[role]}`}>
              {role}: {count}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden border-slate-200 shadow-xl shadow-slate-200/20">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Name</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Email</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Role</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-primary font-black text-sm group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-900 font-black text-base tracking-tight group-hover:text-brand-primary transition-colors">{user.name}</p>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                          ID: {user._id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <span className="text-slate-600 font-bold text-sm">{user.email}</span>
                  </td>
                  <td className="px-8 py-7">
                    {(() => {
                      const roleStyles = {
                        admin: 'bg-rose-50 text-rose-600 border-rose-100',
                        manager: 'bg-amber-50 text-amber-600 border-amber-100',
                        chef: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                        waiter: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      };
                      return (
                        <span className={`badge border font-black ${roleStyles[user.role] || 'bg-slate-50 text-slate-400 border-slate-100'} py-1.5 px-4`}>
                          {user.role}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-8 py-7">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${user.active
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-600'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                      {user.active ? 'Active' : 'Standby'}
                    </button>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex items-center gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-300 transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-500 border border-slate-100 hover:border-rose-100 transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-40 text-center bg-slate-50/30">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">No staff members added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? `Edit Staff — ${modal.editing.name}` : 'Add New Staff Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={set('name')}
                placeholder="Operator label"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={set('email')}
                placeholder="email@restaurant.com"
                required
              />
            </div>
          </div>

          {!modal.editing && (
            <div className="space-y-2">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={set('password')}
                placeholder="Minimum 6 characters"
                required={!modal.editing}
                minLength={6}
              />
            </div>
          )}

          <div className="space-y-4">
            <label className="form-label">Role *</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role }))}
                  className={`py-4 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border text-center ${form.role === role
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={submitting}
            type="submit"
            className="btn-primary w-full py-5 text-[12px] uppercase tracking-[0.2em]"
          >
            {submitting ? 'Saving...' : modal.editing ? 'Save Changes' : 'Add Staff Member'}
          </button>
        </form>
      </Modal>
    </div>

  );
}