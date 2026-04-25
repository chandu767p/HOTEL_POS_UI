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

const defaultForm = { name: '', email: '', password: '', role: '' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ]);
      setUsers(usersRes.data.data || usersRes.data.users || []);
      setRoles(rolesRes.data.data || []);
      if (rolesRes.data.data?.length > 0 && !form.role) {
        setForm(p => ({ ...p, role: rolesRes.data.data[0]._id }));
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, form.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setForm({ ...defaultForm, role: roles[0]?._id || '' });
    setModal({ open: true, editing: null });
  };

  const openEdit = (user) => {
    setForm({ 
      name: user.name, 
      email: user.email, 
      password: '', 
      role: user.role?._id || user.role 
    });
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
    <div className="flex items-center justify-center h-[80vh] bg-background">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Staff Registry</h1>
          <p className="text-text-muted text-xs mt-1">{users.length} registered operators</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary"
        >
          Add Staff
        </button>
      </div>

      {/* Summary Badges */}
      <div className="flex gap-2 flex-wrap">
        {roles.map(role => {
          const count = users.filter(u => (u.role?._id || u.role) === role._id).length;
          const roleStyles = {
            admin: 'status-red',
            manager: 'status-orange',
            chef: 'status-blue',
            waiter: 'status-green',
          };
          return (
            <div key={role._id} className={`px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-none ${roleStyles[role.name] || 'status-blue'}`}>
              {role.name}: {count}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-minimal">
            <thead>
              <tr>
                <th className="w-[30%]">Staff Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-background border border-border flex items-center justify-center text-text-muted font-bold text-sm group-hover:text-brand-primary group-hover:border-brand-primary transition-none">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-bold text-sm tracking-tight group-hover:text-brand-primary transition-none">{user.name}</p>
                        <p className="text-text-muted text-[10px] font-medium uppercase mt-0.5 tracking-tight">ID: {user._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-text-muted font-medium text-[13px]">{user.email}</span>
                  </td>
                  <td>
                    {(() => {
                      const roleName = user.role?.name || user.role;
                      const roleStyles = {
                        admin: 'status-red',
                        manager: 'status-orange',
                        chef: 'status-blue',
                        waiter: 'status-green',
                      };
                      return (
                        <span className={`badge ${roleStyles[roleName] || 'status-blue'} text-[10px]`}>
                          {roleName}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-none
                        ${user.active
                          ? 'text-brand-success bg-brand-success/5 border border-brand-success/10 hover:bg-brand-success/10'
                          : 'text-text-muted bg-border/20 border border-border/30 hover:bg-border/30'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-brand-success' : 'bg-text-muted'}`}></div>
                      {user.active ? 'Active' : 'Standby'}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center gap-1 justify-end  transition-none">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 rounded bg-background text-text-muted hover:text-text-primary border border-border transition-none"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded bg-brand-danger/5 text-brand-danger/60 hover:text-brand-danger border border-brand-danger/10 transition-none"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-32 text-center border-t border-border">
              <p className="text-text-muted font-semibold uppercase tracking-widest text-xs">No operators found</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit Member' : 'New Enrollment'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={set('name')}
                placeholder="Identity Label"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Email Node</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={set('email')}
                placeholder="email@node.com"
                required
              />
            </div>
          </div>

          {!modal.editing && (
            <div className="space-y-1.5">
              <label className="form-label">Access Token</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={set('password')}
                placeholder="Min 6 characters"
                required={!modal.editing}
                minLength={6}
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="form-label">Clearance Level</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {roles.map(role => (
                <button
                  key={role._id}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role: role._id }))}
                  className={`py-3 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-none border text-center ${form.role === role._id
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-surface text-text-muted border-border hover:text-text-primary'
                    }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={submitting}
            type="submit"
            className="btn-primary w-full py-3 text-xs uppercase tracking-widest"
          >
            {submitting ? 'Enrolling...' : modal.editing ? 'Update Staff' : 'Enroll Staff'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
