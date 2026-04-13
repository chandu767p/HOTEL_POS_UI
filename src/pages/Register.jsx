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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Accents */}
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-slate-200/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="card w-full max-w-lg p-12 relative z-10 animate-in fade-in zoom-in-95 duration-700 shadow-2xl shadow-brand-primary/5 border-slate-200">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 mx-auto mb-8 flex items-center justify-center shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4 text-slate-900 border-b-4 border-brand-primary inline-block">Create Account</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Register your restaurant account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="form-label">Full Name</label>
            <input className="form-input py-4" value={form.name} onChange={set('name')} placeholder="Your full name" />
            {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 uppercase">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="form-label">Email</label>
            <input className="form-input py-4" type="email" value={form.email} onChange={set('email')} placeholder="email@restaurant.com" />
            {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 uppercase">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="form-label">Password</label>
            <input className="form-input py-4" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
            {errors.password && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 uppercase">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="form-label">Role</label>
            <select className="form-input py-4 h-auto cursor-pointer" value={form.role} onChange={set('role')}>
              <option value="waiter">Waiter</option>
              <option value="chef">Chef</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-5 text-[12px] uppercase tracking-[0.3em] mt-4">
            {loading ? <div className="flex items-center justify-center gap-3"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> <span>Creating...</span></div> : 'Create Account'}
          </button>

          <div className="text-center pt-8 border-t border-slate-100 mt-8">
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-primary font-black hover:underline transition-all ml-1">Sign In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
