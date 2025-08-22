import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Tooltip } from '../UI/Tooltip';
import { NotificationService } from '../../services/notifications';
import '../../styles/layout.css';

interface TopNavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick, title = 'Dashboard' }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationsToggle = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const handleNotificationClick = async (notificationId: number, isUnread: boolean) => {
    if (isUnread) {
      await markAsRead([notificationId]);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Theme management
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <header className="top-navbar">
      <div className="top-navbar-container">
        {/* Left Section */}
        <div className="top-navbar-left">
          {/* Mobile Menu Button */}
          <Tooltip content="Toggle menu" position="bottom">
            <button onClick={onMenuClick} className="top-navbar-menu-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </Tooltip>

          {/* Page Title */}
          <h1 className="top-navbar-title">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="top-navbar-right">
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <Tooltip content="Notifications" position="bottom">
              <button onClick={handleNotificationsToggle} className="top-navbar-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="dropdown notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="dropdown-unread">
                      {unreadCount} unread
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="mark-all-read-btn"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification.id, !notification.read_at)}
                      >
                        <div className="notification-content">
                          <div className="notification-text">
                            <div className="notification-title">
                              <span className="notification-icon">
                                {NotificationService.getNotificationIcon(notification.notification_type)}
                              </span>
                              <p>{notification.title}</p>
                              {!notification.read_at && <div className="unread-dot" />}
                            </div>
                            <p className="notification-message">
                              {notification.message}
                            </p>
                          </div>
                          <span className="notification-time">
                            {NotificationService.formatNotificationTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="dropdown-footer">
                  <button>View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <Tooltip content="Account menu" position="bottom">
              <button onClick={handleUserMenuToggle} className="user-menu-btn">
                <div className="user-menu-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-menu-arrow">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>
            </Tooltip>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="dropdown user-dropdown">
                <div className="user-dropdown-info">
                  <p className="user-dropdown-name">{user?.name}</p>
                  <p className="user-dropdown-email">{user?.email}</p>
                </div>
                
                <div className="user-dropdown-section">
                  <Link 
                    to="/profile" 
                    className="user-dropdown-link"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Your Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    className="user-dropdown-link"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                </div>

                <div className="user-dropdown-section">
                  <button onClick={handleLogout} className="user-dropdown-button logout">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Tooltip content="Toggle theme" position="bottom">
            <button onClick={toggleTheme} className="top-navbar-btn">
              {isDark ? (
                // Sun icon for light mode
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div 
          className="dropdown-backdrop" 
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};