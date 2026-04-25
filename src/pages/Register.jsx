import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'waiter' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Identity name required';
    if (!form.email.trim()) e.email = 'Access email required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Malformed identity address';
    if (!form.password) e.password = 'Security code required';
    else if (form.password.length < 6) e.password = 'Min 6 character threshold';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    setErrors((p) => ({ ...p, [f]: undefined }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card w-full max-w-md p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-xl bg-surface border border-border mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">Create Account</h1>
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Register your restaurant node</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Your name" />
            {errors.name && <p className="text-[10px] text-brand-danger font-bold mt-1 ml-1 uppercase">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="form-label">Email Node</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="email@restaurant.com" />
            {errors.email && <p className="text-[10px] text-brand-danger font-bold mt-1 ml-1 uppercase">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="form-label">Access Token</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
            {errors.password && <p className="text-[10px] text-brand-danger font-bold mt-1 ml-1 uppercase">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="form-label">Clearance Level</label>
            <select className="form-input" value={form.role} onChange={set('role')}>
              <option value="waiter">Waiter</option>
              <option value="chef">Chef</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs uppercase tracking-[0.2em] mt-2">
            {loading ? <LoadingSpinner size="sm" /> : 'Register'}
          </button>

          <div className="text-center pt-6 border-t border-border mt-6">
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest">
              Existing account?{' '}
              <Link to="/login" className="text-brand-primary hover:text-brand-primary/80 transition-none ml-1">Sign In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
