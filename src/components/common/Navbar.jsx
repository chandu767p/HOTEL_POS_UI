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
    <header className="h-16 bg-surface border-b border-border flex items-center px-6 gap-6 flex-shrink-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-text-muted hover:text-text-primary hover:bg-background rounded transition-none"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-lg font-bold text-text-primary uppercase tracking-wider">{title}</h1>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Today</span>
          <span className="text-xs font-semibold text-text-primary">
            {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}
          </span>
        </div>
        <div className="w-px h-6 bg-border mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-success"></div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Live</span>
        </div>
      </div>
    </header>
  );
}