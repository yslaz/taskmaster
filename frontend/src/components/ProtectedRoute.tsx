import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'path:', location.pathname);

  if (isLoading) {
    console.log('ProtectedRoute - showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="spinner"></span>
          <span className="text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - user not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute - user authenticated, rendering children');
  return <>{children}</>;
};