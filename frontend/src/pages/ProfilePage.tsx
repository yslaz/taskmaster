import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-section">
        <div className="profile-container">
          <div className="profile-header">
            <p className="profile-subtitle">Manage your account settings</p>
          </div>
          
          <div className="profile-form">
            <div className="profile-form-group">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.name || ''} 
                  readOnly 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={user?.email || ''} 
                  readOnly 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Member Since</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} 
                  readOnly 
                />
              </div>
              <div className="profile-actions">
                <button className="btn btn-secondary" disabled>
                  Edit Profile (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};