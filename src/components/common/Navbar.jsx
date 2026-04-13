import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/tables': 'Tables',
  '/menu': 'Menu',
  '/orders': 'Orders',
  '/users': 'Staff',
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'EdenSoft X';

  return (
    <header className="h-20 bg-black backdrop-blur-xl border-b border-white/10 flex items-center px-8 gap-6 flex-shrink-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-6">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1.5">Today</span>
          <span className="text-xs font-semibold text-gray-300">
            {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}
          </span>
        </div>
        <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"></div>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Active</span>
        </div>
      </div>
    </header>
  );
}