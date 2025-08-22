import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <div className="container nav-container">
        <Link to="/analytics" className="nav-brand">
          TaskMaster
        </Link>

        {/* Desktop Navigation */}
        <ul className="nav-menu">
          <li>
            <Link to="/analytics" className="nav-link">
              Analytics
            </Link>
          </li>
          <li>
            <Link to="/tasks" className="nav-link">
              Tasks
            </Link>
          </li>
          <li>
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
          </li>
          <li>
            <span className="text-muted text-sm">
              Welcome, {user?.name}
            </span>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
            >
              Logout
            </button>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="btn btn-secondary btn-sm md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {isMenuOpen ? (
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <ul className="nav-menu open md:hidden">
            <li>
              <Link 
                to="/analytics" 
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link 
                to="/tasks" 
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Tasks
              </Link>
            </li>
            <li>
              <Link 
                to="/profile" 
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
            </li>
            <li className="py-2">
              <span className="text-muted text-sm">
                Welcome, {user?.name}
              </span>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm w-full"
              >
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};