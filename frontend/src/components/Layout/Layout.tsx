// Legacy Layout - kept for backward compatibility
import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

// Export new layouts
export { DashboardLayout } from './DashboardLayout';
export { NewDashboardLayout } from './NewDashboardLayout';
export { Sidebar } from './Sidebar';
export { TopNavbar } from './TopNavbar';