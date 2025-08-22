import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/Layout/DashboardLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TasksPage } from './pages/TasksPage';
import { ProfilePage } from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  console.log('App component rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes with Dashboard Layout */}
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AnalyticsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TasksPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <div className="content-section">
                      <p className="text-secondary-600">Settings page coming soon...</p>
                    </div>
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/analytics" replace />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/analytics" replace />} />
          </Routes>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
