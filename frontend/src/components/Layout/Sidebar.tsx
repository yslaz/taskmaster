import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../UI/ConfirmModal';
import logoImage from '../../assets/images/logo.png';
import '../../styles/layout.css';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

const navigationItems = [
  {
    path: '/analytics',
    label: 'Analytics',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    )
  },
  {
    path: '/tasks',
    label: 'Tasks',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3-7.5H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    )
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    )
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    )
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed = false, onClose, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    onClose();
    setShowLogoutConfirm(false);
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-mobile-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-visible' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-img">
              <img src={logoImage} alt="TaskMaster" />
            </div>
            <h2 className="sidebar-title">TaskMaster</h2>
          </div>
          
          <div className="sidebar-header-actions">
            {/* Desktop Collapse Button */}
            {onToggleCollapse && (
              <button onClick={onToggleCollapse} className="sidebar-collapse-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={isCollapsed ? "M13 5l7 7-7 7M6 5l7 7-7 7" : "M11 19l-7-7 7-7M19 19l-7-7 7-7"} />
                </svg>
              </button>
            )}
            
            {/* Mobile Close Button */}
            <button onClick={onClose} className="sidebar-close-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-details">
              <p className="sidebar-user-name">
                {user?.name || 'User'}
              </p>
              <p className="sidebar-user-email">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="sidebar-nav-list">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path} className="sidebar-nav-item">
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirmar cierre de sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        variant="warning"
      />
    </>
  );
};