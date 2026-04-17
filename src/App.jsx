import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Tables from './pages/Tables';
import MenuManager from './pages/MenuManager';
import Orders from './pages/Orders';
import OrderPortal from './pages/OrderPortal';
import Kitchens from './pages/Kitchens';
import Reports from './pages/Reports';
import PrivateRoute from './components/common/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />


              {/* Main app with Layout */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tables" element={<Tables />} />
                <Route path="order/:tableId" element={<OrderPortal />} />
                <Route path="menu" element={<MenuManager />} />
                <Route path="orders" element={<Orders />} />
                <Route path="users" element={<Users />} />
                <Route path="kitchens" element={<Kitchens />} />
                <Route path="reports" element={<Reports />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
