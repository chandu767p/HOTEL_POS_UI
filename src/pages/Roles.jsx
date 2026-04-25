import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentRole, setCurrentRole] = useState({ name: '', description: '', permissions: [] });
  const { addToast } = useToast();

  const permissionsList = [
    'manage_orders', 'manage_menu', 'manage_tables', 'manage_staff', 'view_reports', 'manage_kitchen', 'manage_roles'
  ];

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data.data);
    } catch (err) {
      addToast('Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (currentRole._id) {
        await api.put(`/roles/${currentRole._id}`, currentRole);
        addToast('Role updated', 'success');
      } else {
        await api.post('/roles', currentRole);
        addToast('Role created', 'success');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (role) => {
    setCurrentRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await api.delete(`/roles/${id}`);
      addToast('Role deleted', 'success');
      fetchRoles();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const togglePermission = (perm) => {
    setCurrentRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev, perm]
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Roles & Permissions</h1>
        <button
          onClick={() => { setCurrentRole({ name: '', description: '', permissions: [] }); setIsModalOpen(true); }}
          className="btn-primary"
        >
          Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role._id} className="card p-6 border-t-2 border-brand-primary">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">{role.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(role)} className="text-text-muted hover:text-brand-primary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                {!role.isDefault && (
                  <button onClick={() => handleDelete(role._id)} className="text-text-muted hover:text-brand-danger">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-text-muted mb-4">{role.description}</p>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map(p => (
                <span key={p} className="badge bg-brand-primary/10 text-brand-primary text-[9px] uppercase font-bold">{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentRole._id ? 'Edit Role' : 'Add Role'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Role Name</label>
            <input
              className="form-input"
              value={currentRole.name}
              onChange={e => setCurrentRole({ ...currentRole, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              value={currentRole.description}
              onChange={e => setCurrentRole({ ...currentRole, description: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Permissions</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {permissionsList.map(perm => (
                <label key={perm} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentRole.permissions.includes(perm)}
                    onChange={() => {
                      const newPerms = currentRole.permissions.includes(perm)
                        ? currentRole.permissions.filter(p => p !== perm)
                        : [...currentRole.permissions, perm];
                      setCurrentRole({ ...currentRole, permissions: newPerms });
                    }}
                    className="rounded border-border text-brand-primary focus:ring-brand-primary bg-background"
                  />
                  {perm.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>
          <button disabled={submitting} type="submit" className="btn-primary w-full py-3">
            {submitting ? 'Saving...' : 'Save Role'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
