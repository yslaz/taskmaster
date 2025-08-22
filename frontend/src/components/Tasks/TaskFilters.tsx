import React from 'react';
import type { TaskStatus, TaskPriority, TaskFilters } from '../../types/index';
import { SearchInput } from '../UI/SearchInput';

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onResetFilters: () => void;
}

export const TaskFiltersBar: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  onResetFilters,
}) => {
  const updateFilter = (key: keyof TaskFilters, value: any) => {
    let processedValue = value;
    
    // Convert datetime-local input to ISO string for API
    if (['created_from', 'created_to', 'due_from', 'due_to'].includes(key) && value) {
      processedValue = new Date(value).toISOString();
    }
    
    onFiltersChange({
      ...filters,
      [key]: processedValue,
      // Reset to page 1 when filters change
      page: key === 'page' ? value : 1,
    });
  };

  const hasActiveFilters = !!(
    filters.status ||
    filters.priority ||
    filters.search ||
    filters.tag ||
    filters.created_from ||
    filters.created_to ||
    filters.due_from ||
    filters.due_to
  );

  return (
    <div className="card">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <SearchInput
            placeholder="Search tasks by title or description..."
            onSearch={(query) => updateFilter('search', query || undefined)}
            initialValue={filters.search || ''}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-40">
          <select
            className="select w-full"
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value || undefined)}
          >
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="w-full lg:w-40">
          <select
            className="select w-full"
            value={filters.priority || ''}
            onChange={(e) => updateFilter('priority', e.target.value || undefined)}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Tag Filter */}
        <div className="w-full lg:w-40">
          <input
            type="text"
            className="input w-full"
            placeholder="Filter by tag..."
            value={filters.tag || ''}
            onChange={(e) => updateFilter('tag', e.target.value || undefined)}
          />
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="btn btn-secondary whitespace-nowrap"
            title="Clear all filters"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Date Range Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mt-4 pt-4 border-t">
        <div className="text-sm font-medium text-muted mb-2 lg:mb-0 lg:self-center">
          Date Filters:
        </div>
        
        {/* Created Date Range */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="text-xs text-muted">Created:</label>
          <input
            type="datetime-local"
            className="input text-sm"
            placeholder="From"
            value={filters.created_from ? new Date(filters.created_from).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateFilter('created_from', e.target.value || undefined)}
          />
          <input
            type="datetime-local"
            className="input text-sm"
            placeholder="To"
            value={filters.created_to ? new Date(filters.created_to).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateFilter('created_to', e.target.value || undefined)}
          />
        </div>

        {/* Due Date Range */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="text-xs text-muted">Due:</label>
          <input
            type="datetime-local"
            className="input text-sm"
            placeholder="From"
            value={filters.due_from ? new Date(filters.due_from).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateFilter('due_from', e.target.value || undefined)}
          />
          <input
            type="datetime-local"
            className="input text-sm"
            placeholder="To"
            value={filters.due_to ? new Date(filters.due_to).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateFilter('due_to', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted">Active filters:</span>
            
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs">
                Status: {filters.status}
                <button
                  onClick={() => updateFilter('status', undefined)}
                  className="hover:bg-primary-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            
            {filters.priority && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning-50 text-warning-700 rounded text-xs">
                Priority: {filters.priority}
                <button
                  onClick={() => updateFilter('priority', undefined)}
                  className="hover:bg-warning-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-50 text-secondary-700 rounded text-xs">
                Search: "{filters.search}"
                <button
                  onClick={() => updateFilter('search', undefined)}
                  className="hover:bg-secondary-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            
            {filters.tag && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-50 text-success-700 rounded text-xs">
                Tag: #{filters.tag}
                <button
                  onClick={() => updateFilter('tag', undefined)}
                  className="hover:bg-success-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {filters.created_from && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-info-50 text-info-700 rounded text-xs">
                Created From: {new Date(filters.created_from).toLocaleDateString()}
                <button
                  onClick={() => updateFilter('created_from', undefined)}
                  className="hover:bg-info-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {filters.created_to && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-info-50 text-info-700 rounded text-xs">
                Created To: {new Date(filters.created_to).toLocaleDateString()}
                <button
                  onClick={() => updateFilter('created_to', undefined)}
                  className="hover:bg-info-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {filters.due_from && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-danger-50 text-danger-700 rounded text-xs">
                Due From: {new Date(filters.due_from).toLocaleDateString()}
                <button
                  onClick={() => updateFilter('due_from', undefined)}
                  className="hover:bg-danger-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}

            {filters.due_to && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-danger-50 text-danger-700 rounded text-xs">
                Due To: {new Date(filters.due_to).toLocaleDateString()}
                <button
                  onClick={() => updateFilter('due_to', undefined)}
                  className="hover:bg-danger-100 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};