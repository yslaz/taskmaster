import React, { useState } from 'react';
import type { Task } from '../../types/index';

export interface LocalFilters {
  groupBy: 'none' | 'status' | 'priority' | 'tag' | 'due_date';
  sortBy: 'title' | 'created_at' | 'updated_at' | 'due_date' | 'priority';
  sortOrder: 'asc' | 'desc';
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'overdue' | 'custom';
  customDateFrom?: string;
  customDateTo?: string;
  showCompleted: boolean;
}

interface LocalFiltersProps {
  filters: LocalFilters;
  onFiltersChange: (filters: LocalFilters) => void;
  tasksCount: number;
}

export const LocalFiltersBar: React.FC<LocalFiltersProps> = ({
  filters,
  onFiltersChange,
  tasksCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultFilters: LocalFilters = {
    groupBy: 'none',
    sortBy: 'created_at',
    sortOrder: 'desc',
    dateFilter: 'all',
    showCompleted: true,
  };

  const updateFilter = (key: keyof LocalFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => onFiltersChange(defaultFilters);

  const hasActiveFilters =
    filters.groupBy !== 'none' ||
    filters.sortBy !== defaultFilters.sortBy ||
    filters.sortOrder !== defaultFilters.sortOrder ||
    filters.dateFilter !== 'all' ||
    !filters.showCompleted;

  return (
    <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0 0.25rem 0 0.25rem' }}>
      <div style={{ padding: isExpanded ? '0.5rem' : '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: isExpanded ? '0.9rem' : '0.8rem', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              🎛️ Filters
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: isExpanded ? 11 : 10, color: '#6b7280', backgroundColor: 'white', padding: isExpanded ? '2px 6px' : '1px 4px', borderRadius: 4 }}>
                {tasksCount} task{tasksCount !== 1 ? 's' : ''}
              </span>
              {hasActiveFilters && (
                <>
                  {filters.groupBy !== 'none' && (
                    <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: isExpanded ? 10 : 9, padding: isExpanded ? '2px 4px' : '1px 3px' }}>
                      {filters.groupBy === 'status' ? 'Status' : filters.groupBy === 'priority' ? 'Priority' : filters.groupBy === 'tag' ? 'Tag' : 'Due'}
                    </span>
                  )}
                  {(filters.sortBy !== defaultFilters.sortBy || filters.sortOrder !== defaultFilters.sortOrder) && (
                    <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: isExpanded ? 10 : 9, padding: isExpanded ? '2px 4px' : '1px 3px' }}>
                      {filters.sortBy === 'title' ? 'Title' : filters.sortBy === 'created_at' ? 'Created' : filters.sortBy === 'updated_at' ? 'Updated' : filters.sortBy === 'due_date' ? 'Due' : 'Priority'} {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                  {filters.dateFilter !== 'all' && (
                    <span className="badge" style={{ backgroundColor: '#dcfdf7', color: '#047857', fontSize: isExpanded ? 10 : 9, padding: isExpanded ? '2px 4px' : '1px 3px' }}>
                      {filters.dateFilter === 'today' ? 'Today' : filters.dateFilter === 'week' ? 'Week' : filters.dateFilter === 'month' ? 'Month' : filters.dateFilter === 'overdue' ? 'Late' : 'Custom'}
                    </span>
                  )}
                  {!filters.showCompleted && (
                    <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: isExpanded ? 10 : 9, padding: isExpanded ? '2px 4px' : '1px 3px' }}>
                      Hide done
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
        </div>

        {/* Quick Actions Row */}
        {isExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 8 }}>
            {/* Group By */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                Group by
              </label>
              <select
                className="input"
                style={{ fontSize: 12, padding: '6px' }}
                value={filters.groupBy}
                onChange={(e) => updateFilter('groupBy', e.target.value as LocalFilters['groupBy'])}
              >
                <option value="none">None</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
                <option value="tag">Tag</option>
                <option value="due_date">Due</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                Sort by
              </label>
              <select
                className="input"
                style={{ fontSize: 12, padding: '6px' }}
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value as LocalFilters['sortBy'])}
              >
                <option value="title">Title</option>
                <option value="created_at">Created</option>
                <option value="updated_at">Updated</option>
                <option value="due_date">Due</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                Order
              </label>
              <button
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: 12, padding: '6px', minHeight: 'auto', width: '100%' }}
                title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            {/* Date Filter */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                Date range
              </label>
              <select
                className="input"
                style={{ fontSize: 12, padding: '6px' }}
                value={filters.dateFilter}
                onChange={(e) => updateFilter('dateFilter', e.target.value as LocalFilters['dateFilter'])}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="overdue">Late</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Show Completed and Reset */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                Options
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={filters.showCompleted}
                    onChange={(e) => updateFilter('showCompleted', e.target.checked)}
                    style={{ margin: 0, transform: 'scale(0.8)' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Done</span>
                </label>
                
                <button onClick={resetFilters} className="btn btn-sm btn-secondary" title="Reset filters" style={{ fontSize: 12, padding: '4px 6px', minHeight: 'auto' }}>
                  <svg style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.15rem' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Options */}
        {isExpanded && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            {/* Custom Date Range */}
            {filters.dateFilter === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                    Date from
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={filters.customDateFrom || ''}
                    onChange={(e) => updateFilter('customDateFrom', e.target.value || undefined)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                    Date to
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={filters.customDateTo || ''}
                    onChange={(e) => updateFilter('customDateTo', e.target.value || undefined)}
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

// Utility functions for filtering and grouping
export const applyLocalFilters = (tasks: Task[], filters: LocalFilters): Task[] => {
  let filteredTasks = [...tasks];

  // Date filtering
  if (filters.dateFilter !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filteredTasks = filteredTasks.filter(task => {
      if (!task.due_date && filters.dateFilter !== 'all') return false;
      
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      
      switch (filters.dateFilter) {
        case 'today':
          return dueDate && dueDate.toDateString() === today.toDateString();
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return dueDate && dueDate >= today && dueDate <= weekFromNow;
        case 'month':
          const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
          return dueDate && dueDate >= today && dueDate <= monthFromNow;
        case 'overdue':
          return dueDate && dueDate < today && task.status !== 'done';
        case 'custom':
          if (!filters.customDateFrom && !filters.customDateTo) return true;
          const fromDate = filters.customDateFrom ? new Date(filters.customDateFrom) : null;
          const toDate = filters.customDateTo ? new Date(filters.customDateTo) : null;
          
          if (fromDate && toDate) {
            return dueDate && dueDate >= fromDate && dueDate <= toDate;
          } else if (fromDate) {
            return dueDate && dueDate >= fromDate;
          } else if (toDate) {
            return dueDate && dueDate <= toDate;
          }
          return true;
        default:
          return true;
      }
    });
  }

  // Show/hide completed tasks
  if (!filters.showCompleted) {
    filteredTasks = filteredTasks.filter(task => task.status !== 'done');
  }

  // Sorting
  filteredTasks.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (filters.sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'updated_at':
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
      case 'due_date':
        aValue = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
        bValue = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
        break;
      case 'priority':
        const priorityOrder = { high: 3, med: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filteredTasks;
};

export const groupTasks = (tasks: Task[], groupBy: LocalFilters['groupBy']): { [key: string]: Task[] } => {
  if (groupBy === 'none') {
    return { 'All tasks': tasks };
  }

  const groups: { [key: string]: Task[] } = {};

  tasks.forEach(task => {
    let groupKey: string;

    switch (groupBy) {
      case 'status':
        groupKey = task.status === 'todo' ? '📋 To do' :
                  task.status === 'doing' ? '⚡ In progress' :
                  task.status === 'done' ? '✅ Completed' : task.status;
        break;
      case 'priority':
        groupKey = task.priority === 'high' ? '🔴 High' :
                  task.priority === 'med' ? '🟡 Medium' :
                  task.priority === 'low' ? '🟢 Low' : task.priority;
        break;
      case 'tag':
        if (task.tags && task.tags.length > 0) {
          task.tags.forEach(tag => {
            groupKey = `🏷️ ${tag}`;
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(task);
          });
          return;
        } else {
          groupKey = '🏷️ No tags';
        }
        break;
      case 'due_date':
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            groupKey = '🔴 Overdue';
          } else if (diffDays === 0) {
            groupKey = '🟡 Today';
          } else if (diffDays <= 7) {
            groupKey = '🟠 This week';
          } else if (diffDays <= 30) {
            groupKey = '🔵 This month';
          } else {
            groupKey = '⚪ Later';
          }
        } else {
          groupKey = '📅 No due date';
        }
        break;
      default:
        groupKey = 'Ungrouped';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(task);
  });

  return groups;
};