import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      // FIX: Use actual form password — no more hardcoded override
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 z-0"></div>

      <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl shadow-gray-200/50 w-full max-w-md overflow-hidden relative z-10">
        <div className="bg-gray-50/50 px-8 py-12 text-center border-b border-gray-100">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 mx-auto mb-6 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-200">
            A
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">AJARK POS</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Sign in to your terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="px-10 py-10 space-y-8">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="admin@ajark.com"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-6 py-4 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              placeholder="••••••••"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-6 py-4 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-gray-300 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="uppercase tracking-widest text-xs">Authenticating...</span>
              </>
            ) : <span className="uppercase tracking-widest text-xs">Access Terminal</span>}
          </button>

          <p className="text-center text-xs font-bold text-gray-400">
            Need an account?{' '}
            <Link to="/register" className="text-indigo-600 font-black hover:text-indigo-800 transition-colors">
              Register Worker
            </Link>
          </p>

          <div className="pt-4 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic">Demo: admin@ajark.com / password123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
