import React from 'react';

export type ViewMode = 'grid' | 'list' | 'kanban';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({ 
  viewMode, 
  onViewModeChange 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.25rem', 
      backgroundColor: '#f3f4f6', 
      borderRadius: '0.375rem', 
      padding: '0.125rem' 
    }}>
      <button
        onClick={() => onViewModeChange('grid')}
        style={{
          padding: '0.375rem 0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
          color: viewMode === 'grid' ? '#1f2937' : '#6b7280',
          fontSize: '0.875rem',
          fontWeight: viewMode === 'grid' ? '500' : '400',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: viewMode === 'grid' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
        }}
        title="Vista en cuadrícula"
      >
        <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      
      <button
        onClick={() => onViewModeChange('list')}
        style={{
          padding: '0.375rem 0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
          color: viewMode === 'list' ? '#1f2937' : '#6b7280',
          fontSize: '0.875rem',
          fontWeight: viewMode === 'list' ? '500' : '400',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: viewMode === 'list' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
        }}
        title="Vista en lista"
      >
        <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button
        onClick={() => onViewModeChange('kanban')}
        style={{
          padding: '0.375rem 0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          backgroundColor: viewMode === 'kanban' ? '#ffffff' : 'transparent',
          color: viewMode === 'kanban' ? '#1f2937' : '#6b7280',
          fontSize: '0.875rem',
          fontWeight: viewMode === 'kanban' ? '500' : '400',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: viewMode === 'kanban' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
        }}
        title="Vista Kanban"
      >
        <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
        </svg>
      </button>
    </div>
  );
};
