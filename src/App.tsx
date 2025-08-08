import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { BrokerSignup } from './pages/BrokerSignup';
import { VendorSignup } from './pages/VendorSignup';
import { Pricing } from './pages/Pricing';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { PreQualify } from './pages/PreQualify';
import { Deals } from './pages/Deals';
import { Messages } from './pages/Messages';
import { Resources } from './pages/Resources';
import { Vendors } from './pages/Vendors';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public marketing routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/broker-signup" element={<BrokerSignup />} />
            <Route path="/vendor-signup" element={<VendorSignup />} />
            
            {/* Public auth routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            
            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route
                path="pre-qualify"
                element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <PreQualify />
                  </ProtectedRoute>
                }
              />
              <Route path="deals" element={<Deals />} />
              <Route path="messages" element={<Messages />} />
              <Route path="resources" element={<Resources />} />
              <Route
                path="vendors"
                element={
                  <ProtectedRoute allowedRoles={['broker', 'loan_officer']}>
                    <Vendors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['broker']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all route - redirect to landing page instead of dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;