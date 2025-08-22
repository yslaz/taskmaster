import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import '../../styles/dashboard-layout.css';

interface NewDashboardLayoutProps {
  children?: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/analytics': 'Analytics',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/reports': 'Reports'
};

export const NewDashboardLayout: React.FC<NewDashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Mobile sidebar management
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      }
    };

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

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';
  const taskMatch = location.pathname.match(/\/tasks\/(.+)/);
  const dynamicTitle = taskMatch ? `Task Details` : currentTitle;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          isCollapsed={isCollapsed}
          onClose={closeSidebar}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>
      
      {/* Main content area */}
      <div className={`dashboard-main-area ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Navigation */}
        <div className="dashboard-topbar">
          <TopNavbar 
            onMenuClick={toggleSidebar} 
            title={dynamicTitle}
          />
        </div>
        
        {/* Contenido */}
        <div className="dashboard-content-area">
          <div className="dashboard-content-inner">
            {children || <Outlet />}
          </div>
        </div>
      </div>
      
      {/* Overlay para mobile */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30
          }}
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};