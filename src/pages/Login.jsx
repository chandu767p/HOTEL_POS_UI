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

  const [kitchens, setKitchens] = useState([]);

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/kitchens`)
      .then(res => res.json())
      .then(data => setKitchens(data.data || []))
      .catch(err => console.error('Failed to fetch kitchens for display:', err));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-8">
      <div className="card w-full max-w-md p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-xl bg-surface border border-border mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
            Eden<span className="text-brand-primary">Soft</span>
          </h1>
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Minimalist POS Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="form-label">Email Node</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="operator@edensoft.com"
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="form-label">Access Token</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              placeholder="••••••••"
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs uppercase tracking-[0.2em] mt-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : <span>Sign In</span>}
          </button>
        </form>
      </div>

      {/* Public Display Links */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-4">
           <div className="h-px flex-1 bg-border/40"></div>
           <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Kitchen Displays</span>
           <div className="h-px flex-1 bg-border/40"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to="/kitchen" 
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface/30 border border-border/40 hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
          >
            <span className="text-[10px] font-black text-text-primary uppercase tracking-widest group-hover:text-brand-primary transition-none text-center">Master Kitchen</span>
            <span className="text-[8px] font-bold text-text-muted mt-1 uppercase">All Orders</span>
          </Link>
          
          {kitchens.map(k => (
            <Link 
              key={k._id}
              to={`/kitchen/${encodeURIComponent(k.name)}`}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface/30 border border-border/40 hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
            >
              <span className="text-[10px] font-black text-text-primary uppercase tracking-widest group-hover:text-brand-primary transition-none text-center truncate w-full">{k.name}</span>
              <span className="text-[8px] font-bold text-text-muted mt-1 uppercase">Station Display</span>
            </Link>
          ))}
        </div>
        
        <p className="text-center text-[9px] text-text-muted/60 font-medium uppercase tracking-[0.1em]">
          Public displays do not require authentication for monitoring.
        </p>
      </div>
    </div>
  );
}
