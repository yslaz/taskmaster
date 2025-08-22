import React, { useState } from 'react';
import type { TaskFilters } from '../../types/index';

interface QueryFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
}

export const QueryFilters: React.FC<QueryFiltersProps> = ({ filters, onFiltersChange, onResetFilters, onApplyFilters }) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    let processed = value;
    if (['created_from', 'created_to', 'due_from', 'due_to'].includes(key as string) && value) {
      processed = new Date(value).toISOString();
    }
    onFiltersChange({ ...filters, [key]: processed, page: key === 'page' ? value : 1 });
    setHasChanges(true);
  };

  const handleApply = () => {
    onApplyFilters();
    setHasChanges(false);
  };

  const handleReset = () => {
    onResetFilters();
    setHasChanges(false);
  };

  return (
    <div className="card" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0 0.25rem 0 0.25rem' }}>
      <div style={{ padding: isExpanded ? 8 : 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: isExpanded ? '0.9rem' : '0.8rem', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              🔍 Query
            </h3>
            <span style={{ fontSize: isExpanded ? 11 : 10, color: '#6b7280', backgroundColor: 'white', padding: isExpanded ? '2px 6px' : '1px 4px', borderRadius: 4 }}>
              {Object.keys(filters).filter((k) => (filters as any)[k] && !['page', 'limit', 'sort_by', 'sort_order'].includes(k)).length} active
            </span>
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="btn btn-sm btn-secondary" title={isExpanded ? 'Collapse' : 'Expand'} style={{ fontSize: isExpanded ? '0.875rem' : '0.75rem', padding: isExpanded ? '0.25rem 0.5rem' : '0.15rem 0.35rem' }}>
            {isExpanded ? (
              <svg style={{ width: isExpanded ? '1rem' : '0.75rem', height: isExpanded ? '1rem' : '0.75rem' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg style={{ width: isExpanded ? '1rem' : '0.75rem', height: isExpanded ? '1rem' : '0.75rem' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {isExpanded && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
              <input
                type="text"
                className="input"
                style={{ fontSize: 12, padding: '6px' }}
                placeholder="🔍 Search"
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value || undefined)}
              />

              <select
                className="input"
                style={{ fontSize: 12, padding: '6px' }}
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value || undefined)}
              >
                <option value="">Status</option>
                <option value="todo">Todo</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>

              <select
                className="input"
                style={{ fontSize: 12, padding: '6px' }}
                value={filters.priority || ''}
                onChange={(e) => updateFilter('priority', e.target.value || undefined)}
              >
                <option value="">Priority</option>
                <option value="low">Low</option>
                <option value="med">Med</option>
                <option value="high">High</option>
              </select>

              <input
                type="text"
                className="input"
                style={{ fontSize: 12, padding: '6px' }}
                placeholder="🏷️ Tag"
                value={filters.tag || ''}
                onChange={(e) => updateFilter('tag', e.target.value || undefined)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Created</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <input
                    type="datetime-local"
                    className="input"
                    style={{ fontSize: 12, padding: '6px' }}
                    value={filters.created_from ? new Date(filters.created_from).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFilter('created_from', e.target.value || undefined)}
                  />
                  <input
                    type="datetime-local"
                    className="input"
                    style={{ fontSize: 12, padding: '6px' }}
                    value={filters.created_to ? new Date(filters.created_to).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFilter('created_to', e.target.value || undefined)}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Due</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <input
                    type="datetime-local"
                    className="input"
                    style={{ fontSize: 12, padding: '6px' }}
                    value={filters.due_from ? new Date(filters.due_from).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFilter('due_from', e.target.value || undefined)}
                  />
                  <input
                    type="datetime-local"
                    className="input"
                    style={{ fontSize: 12, padding: '6px' }}
                    value={filters.due_to ? new Date(filters.due_to).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateFilter('due_to', e.target.value || undefined)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button onClick={handleReset} className="btn btn-secondary btn-sm" style={{ fontSize: 12, padding: '6px 8px' }}>
                🔄 Clear
              </button>
              
              <button onClick={handleApply} className="btn btn-primary btn-sm" disabled={!hasChanges} style={{ fontSize: 12, padding: '6px 8px' }}>
                ✅ Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};