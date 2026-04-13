import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center group">
          <LoadingSpinner size="lg" className="mx-auto mb-6 drop-shadow-[0_0_15px_rgba(168,217,106,0.3)]" />
          <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity duration-700">Authorizing Proxy Access...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
