import React, { useState } from 'react';
import type { TaskFilters, Task } from '../../types/index';
import { useTasks, useTaskFilters } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';
import { TaskFiltersBar } from './TaskFilters';
import { TaskModal } from './TaskModal';
import { Pagination } from '../UI/Pagination';

export const TaskList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  const { filters, setFilters, updateFilter, resetFilters } = useTaskFilters();
  const { data: tasksResponse, isLoading, error, isError } = useTasks(filters);

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const handlePageChange = (page: number) => {
    updateFilter('page', page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page-container">
        <TaskFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={resetFilters}
        />
        
        <div className="content-grid">
          {/* Loading skeletons */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card">
              <div className="loading-skeleton">
                <div className="flex gap-2 mb-3">
                  <div className="h-6 bg-secondary-200 rounded w-16"></div>
                  <div className="h-6 bg-secondary-200 rounded w-12"></div>
                </div>
                <div className="h-6 bg-secondary-200 rounded mb-2"></div>
                <div className="h-4 bg-secondary-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-secondary-200 rounded mb-4 w-1/2"></div>
                <div className="flex gap-1">
                  <div className="h-8 bg-secondary-200 rounded w-16"></div>
                  <div className="h-8 bg-secondary-200 rounded w-16"></div>
                  <div className="h-8 bg-secondary-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="page-container">
        <TaskFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={resetFilters}
        />
        
        <div className="alert alert-error">
          <h3 className="font-semibold mb-2">Failed to load tasks</h3>
          <p>{(error as Error)?.message || 'An unexpected error occurred'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary btn-sm mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tasks = tasksResponse?.tasks || [];
  const total = tasksResponse?.total || 0;
  const totalPages = tasksResponse?.total_pages || 1;
  const currentPage = filters.page || 1;
  const limit = filters.limit || 10;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Tasks</h2>
          <p className="text-muted">
            {total === 0 ? 'No tasks found' : `${total} task${total !== 1 ? 's' : ''} found`}
          </p>
        </div>
        
        <button 
          onClick={handleCreateTask}
          className="btn btn-primary"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Task
        </button>
      </div>

      {/* Filters */}
      <TaskFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={resetFilters}
      />

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <div className="content-section text-center">
          <div className="max-w-sm mx-auto">
            <svg
              className="h-16 w-16 text-muted mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted mb-4">
              {Object.keys(filters).some(key => filters[key as keyof TaskFilters] && key !== 'page' && key !== 'limit')
                ? 'Try adjusting your filters to see more tasks.'
                : 'Get started by creating your first task.'}
            </p>
            
            {Object.keys(filters).some(key => filters[key as keyof TaskFilters] && key !== 'page' && key !== 'limit') ? (
              <button 
                onClick={resetFilters}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            ) : (
              <button 
                onClick={handleCreateTask}
                className="btn btn-primary"
              >
                Create Your First Task
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="content-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={total}
                itemsPerPage={limit}
              />
            </div>
          )}
        </>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />
    </div>
  );
};