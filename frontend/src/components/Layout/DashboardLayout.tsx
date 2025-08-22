import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import '../../styles/layout.css';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

// Page titles mapping
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/analytics': 'Analytics',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/reports': 'Reports'
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Get current page title
  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  // Extract task ID for dynamic titles
  const taskMatch = location.pathname.match(/\/tasks\/(.+)/);
  const dynamicTitle = taskMatch ? `Task Details` : currentTitle;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        isCollapsed={isCollapsed}
        onClose={closeSidebar}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      {/* Main Content */}
      <div className={`dashboard-content ${isCollapsed && window.innerWidth >= 1024 ? 'sidebar-collapsed' : ''}`}>
        {/* Top Navigation */}
        <TopNavbar 
          onMenuClick={toggleSidebar} 
          title={dynamicTitle}
        />
        
        {/* Content Area */}
        <main className="dashboard-main">
          <div className="dashboard-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {children || <Outlet />}
          </div>
        </main>
        
        {/* Footer - Optional */}
        <footer className="dashboard-footer">
          <div className="dashboard-footer-container">
            <div className="dashboard-footer-content">
              <p className="dashboard-footer-copyright">
                © 2024 TaskMaster. All rights reserved.
              </p>
              <div className="dashboard-footer-links">
                <a 
                  href="#" 
                  className="dashboard-footer-link"
                >
                  Privacy Policy
                </a>
                <a 
                  href="#" 
                  className="dashboard-footer-link"
                >
                  Terms of Service
                </a>
                <a 
                  href="#" 
                  className="dashboard-footer-link"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};