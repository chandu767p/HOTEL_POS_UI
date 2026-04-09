import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'waiter' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-indigo-50/50 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 z-0"></div>
      
      <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl shadow-gray-200/50 w-full max-w-md overflow-hidden relative z-10">
        <div className="bg-gray-50/50 px-8 py-10 text-center border-b border-gray-100">
           <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 mx-auto mb-6 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100">
            A
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Registration</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Activate new worker portal</p>
        </div>

        <form onSubmit={handleSubmit} className="px-10 py-10 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Legal Name</label>
            <input className="w-full bg-gray-50/50 border-2 border-gray-50 rounded-3xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-transparent focus:border-indigo-50" value={form.name} onChange={set('name')} placeholder="Full Name" />
            {errors.name && <p className="text-rose-500 text-[10px] mt-1.5 ml-1 font-black italic uppercase tracking-tighter">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Work Email</label>
            <input className="w-full bg-gray-50/50 border-2 border-gray-50 rounded-3xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-transparent focus:border-indigo-50" type="email" value={form.email} onChange={set('email')} placeholder="email@ajark.com" />
            {errors.email && <p className="text-rose-500 text-[10px] mt-1.5 ml-1 font-black italic uppercase tracking-tighter">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Terminal Password</label>
            <input className="w-full bg-gray-50/50 border-2 border-gray-50 rounded-3xl px-5 py-3.5 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-transparent focus:border-indigo-50" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
            {errors.password && <p className="text-rose-500 text-[10px] mt-1.5 ml-1 font-black italic uppercase tracking-tighter">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Operations Role</label>
            <select className="w-full bg-gray-50/50 border-2 border-gray-50 rounded-3xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-transparent focus:border-indigo-50 appearance-none cursor-pointer" value={form.role} onChange={set('role')}>
              <option value="waiter">Waiter</option>
              <option value="chef">Chef</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-gray-200 transition-all mt-4 uppercase tracking-widest text-xs active:scale-95">
            {loading ? 'Processing...' : 'Register Worker'}
          </button>

          <p className="text-center text-xs font-bold text-gray-400 mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-600 font-black hover:text-indigo-800 transition-colors underline decoration-indigo-100 decoration-2 underline-offset-4">Return to Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
