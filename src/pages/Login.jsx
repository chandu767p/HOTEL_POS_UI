import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Identity and access code required');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Accents */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="card w-full max-w-lg p-12 relative z-10 animate-in fade-in zoom-in-95 duration-700 shadow-2xl shadow-brand-primary/5 border-slate-200">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 mx-auto mb-8 flex items-center justify-center shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">
            <span className="text-slate-900 border-b-4 border-brand-primary">Eden</span>
            <span className="text-slate-900">Soft</span>
            <span className="text-brand-primary ml-1 font-mono">X</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Authentic</span>
            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Secure</span>
            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Optimized</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="e.g. administrator@edensoft.com"
              className="form-input py-4 text-base"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              placeholder="••••••••"
              className="form-input py-4 text-base"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-5 text-[12px] uppercase tracking-[0.3em] mt-4"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-4">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : <span>Sign In</span>}
          </button>

          <div className="text-center pt-8 border-t border-slate-100 mt-8">
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">
              New here?{' '}
              <Link to="/register" className="text-brand-primary font-black hover:underline transition-all ml-1">
                Create Account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
