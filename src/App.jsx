import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/common/Layout';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Tables from './pages/Tables';

import Orders from './pages/Orders';
import OrderPortal from './pages/OrderPortal';
import Kitchens from './pages/Kitchens';
import KitchenDashboard from './pages/KitchenDashboard';
import MenuManager from './pages/MenuManager';
import Inventory from './pages/Inventory';
import CustomerOrder from './pages/CustomerOrder';
import Reports from './pages/Reports';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/order" element={<CustomerOrder />} />
            <Route path="/kitchen/:kitchenId?" element={<KitchenDashboard />} />

            {/* Protected POS routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/tables" element={<PrivateRoute><Tables /></PrivateRoute>} />
              <Route path="/order/:tableId" element={<PrivateRoute><OrderPortal /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/menu" element={<PrivateRoute><MenuManager /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
              <Route path="/roles" element={<PrivateRoute><Roles /></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
              <Route path="/kitchens" element={<PrivateRoute><Kitchens /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
