import React, { useState, useMemo, useCallback } from 'react';
import '../styles/tasks.css';
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import type { TaskFilters, Task, TaskStatus, TaskPriority } from '../types/index';
import { applyLocalFilters, groupTasks } from '../components/Tasks/LocalFilters';
import type { LocalFilters } from '../components/Tasks/LocalFilters';
import { TaskGroupView } from '../components/Tasks/TaskGroupView';
import { TaskModal } from '../components/Tasks/TaskModal';
import { TaskListView } from '../components/Tasks/TaskListView';
import { TaskKanbanView } from '../components/Tasks/TaskKanbanView';
import { ViewModeSelector } from '../components/Tasks/ViewModeSelector';
import type { ViewMode } from '../components/Tasks/ViewModeSelector';
import { Accordion } from '../components/UI/Accordion';

export const TasksPage: React.FC = () => {
  // States to control accordions
  const [queryAccordionOpen, setQueryAccordionOpen] = useState(false);
  const [filtersAccordionOpen, setFiltersAccordionOpen] = useState(false);
  
  // State for view mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filter states - separated into temporary input and applied
  const [filterInputs, setFilterInputs] = useState<TaskFilters>({ limit: 10, page: 1 });
  const [appliedFilters, setAppliedFilters] = useState<TaskFilters>({ limit: 10, page: 1 });
  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    groupBy: 'none',
    sortBy: 'created_at',
    sortOrder: 'desc',
    dateFilter: 'all',
    showCompleted: true
  });

  const queryFilters = filterInputs;
  const setQueryFilters = setFilterInputs;

  // Stable toggle functions to avoid re-renders
  const toggleQueryAccordion = useCallback(() => {
    setQueryAccordionOpen(prev => !prev);
  }, []);

  const toggleFiltersAccordion = useCallback(() => {
    setFiltersAccordionOpen(prev => !prev);
  }, []);

  // Task modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const queryBadges = useMemo(() => (
    <>
      {appliedFilters.search && (
        <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: 9, padding: '1px 3px' }}>
          Search: {appliedFilters.search.length > 8 ? appliedFilters.search.substring(0, 8) + '...' : appliedFilters.search}
        </span>
      )}
      {appliedFilters.status && (
        <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: 9, padding: '1px 3px' }}>
          {appliedFilters.status === 'todo' ? 'Todo' : appliedFilters.status === 'doing' ? 'Doing' : 'Done'}
        </span>
      )}
      {appliedFilters.priority && (
        <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: 9, padding: '1px 3px' }}>
          {appliedFilters.priority === 'low' ? 'Low' : appliedFilters.priority === 'med' ? 'Med' : 'High'}
        </span>
      )}
      {appliedFilters.tag && (
        <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#6366f1', fontSize: 9, padding: '1px 3px' }}>
          Tag: {appliedFilters.tag.length > 6 ? appliedFilters.tag.substring(0, 6) + '...' : appliedFilters.tag}
        </span>
      )}
      {(appliedFilters.created_from || appliedFilters.created_to) && (
        <span className="badge" style={{ backgroundColor: '#dcfdf7', color: '#047857', fontSize: 9, padding: '1px 3px' }}>
          Created
        </span>
      )}
      {(appliedFilters.due_from || appliedFilters.due_to) && (
        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 9, padding: '1px 3px' }}>
          Due
        </span>
      )}
      {(appliedFilters.sort_by !== 'created_at' || appliedFilters.sort_order !== 'desc') && (
        <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: 9, padding: '1px 3px' }}>
          Sort: {appliedFilters.sort_by === 'title' ? 'Title' : appliedFilters.sort_by === 'updated_at' ? 'Updated' : appliedFilters.sort_by === 'due_date' ? 'Due' : appliedFilters.sort_by === 'priority' ? 'Priority' : 'Created'} {appliedFilters.sort_order === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </>
  ), [
    appliedFilters.search, 
    appliedFilters.status, 
    appliedFilters.priority, 
    appliedFilters.tag, 
    appliedFilters.created_from, 
    appliedFilters.created_to, 
    appliedFilters.due_from, 
    appliedFilters.due_to, 
    appliedFilters.sort_by, 
    appliedFilters.sort_order
  ]);

  const filterBadges = useMemo(() => (
    <>
      {(localFilters.groupBy !== 'none' ||
        localFilters.sortBy !== 'created_at' ||
        localFilters.sortOrder !== 'desc' ||
        localFilters.dateFilter !== 'all' ||
        !localFilters.showCompleted) && (
        <>
          {localFilters.groupBy !== 'none' && (
            <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: 9, padding: '1px 3px' }}>
              {localFilters.groupBy === 'status' ? 'Status' : localFilters.groupBy === 'priority' ? 'Priority' : localFilters.groupBy === 'tag' ? 'Tag' : 'Due'}
            </span>
          )}
          {(localFilters.sortBy !== 'created_at' || localFilters.sortOrder !== 'desc') && (
            <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: 9, padding: '1px 3px' }}>
              {localFilters.sortBy === 'title' ? 'Title' : localFilters.sortBy === 'created_at' ? 'Created' : localFilters.sortBy === 'updated_at' ? 'Updated' : localFilters.sortBy === 'due_date' ? 'Due' : 'Priority'} {localFilters.sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
          {localFilters.dateFilter !== 'all' && (
            <span className="badge" style={{ backgroundColor: '#dcfdf7', color: '#047857', fontSize: 9, padding: '1px 3px' }}>
              {localFilters.dateFilter === 'today' ? 'Today' : localFilters.dateFilter === 'week' ? 'Week' : localFilters.dateFilter === 'month' ? 'Month' : localFilters.dateFilter === 'overdue' ? 'Late' : 'Custom'}
            </span>
          )}
          {!localFilters.showCompleted && (
            <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 9, padding: '1px 3px' }}>
              Hide Done
            </span>
          )}
        </>
      )}
    </>
  ), [
    localFilters.groupBy, 
    localFilters.sortBy, 
    localFilters.sortOrder, 
    localFilters.dateFilter, 
    localFilters.showCompleted
  ]);

  // Backend query - using useTasks hook for consistency with invalidations
  const { data, isLoading, error, isFetching } = useTasks(appliedFilters);

  // Hooks for mutations
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Functions to apply filters manually
  const handleApplyFilters = () => {
    // For now, simply copy filterInputs to appliedFilters
    const newFilters = { ...filterInputs, page: 1 };
    setAppliedFilters(newFilters);
  };

  const handleResetQueryFilters = () => {
    // Preserve only pagination parameters
    const paginationParams = {
      page: appliedFilters.page,
      limit: appliedFilters.limit
    };
    
    setFilterInputs(paginationParams);
    setAppliedFilters(paginationParams);
  };

  // Function to handle task status changes (for drag & drop)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    console.log('🔄 Status Change Request:', { taskId, newStatus });
    
    try {
      // Update task status with optimistic updates already handled by the hook
      const result = await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: newStatus }
      });
      
      console.log('✅ Status updated successfully:', result);
      
      // Small delay to show the update completed
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('🎯 Update process completed');
      
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      // Error handling is automatically managed by the hook's onError
      throw error;
    }
  };

  // Function to delete tasks
  const handleDeleteTask = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await deleteTaskMutation.mutateAsync(task.id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  // Wrapper function to delete by ID
  const handleDeleteTaskById = async (taskId: string) => {
    const task = filteredTasks.find(t => t.id === taskId);
    if (task) {
      await handleDeleteTask(task);
    }
  };

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

  // Process data
  const tasksPayload = (data && (data as any).tasks)
    ? (data as any)
    : (data && (data as any).data && (data as any).data.tasks)
    ? (data as any).data
    : null;

  const rawTasks = tasksPayload?.tasks || [];
  const total = tasksPayload?.total || 0;
  const currentPage = tasksPayload?.page || appliedFilters.page || 1;
  const totalPages = tasksPayload?.total_pages || Math.ceil((total || 0) / (appliedFilters.limit || 10)) || 1;

  // Apply local filters and grouping
  const filteredTasks = useMemo(() => {
    return applyLocalFilters(rawTasks, localFilters);
  }, [rawTasks, localFilters]);

  const groupedTasks = useMemo(() => {
    return groupTasks(filteredTasks, localFilters.groupBy);
  }, [filteredTasks, localFilters.groupBy]);

  if (isLoading) {
    return (
      <div style={{ padding: '1rem', width: '100%' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>Tasks</h2>
            <p style={{ color: '#6b7280', margin: '0' }}>Loading tasks...</p>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card loading-skeleton">
              <div style={{ height: '1rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '75%', marginBottom: '0.5rem' }}></div>
              <div style={{ height: '0.75rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '50%', marginBottom: '1rem' }}></div>
              <div style={{ height: '2rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '100%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', width: '100%' }}>
        <div className="alert alert-error">
          <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Error loading tasks</h3>
          <p>{(error as Error)?.message || 'An unexpected error occurred'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0.25rem', width: '100%' }}>
      <div className="task-controls task-stats-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderRadius: '0.5rem', 
        padding: '0.25rem',
        marginBottom: '0rem'
      }}>
        <ViewModeSelector viewMode={viewMode} onViewModeChange={setViewMode} />
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', margin: '0', fontSize: '0.8rem' }}>
            {total === 0 ? 'No tasks found' : 
             `${total} task${total !== 1 ? 's' : ''} found • ${filteredTasks.length} visible${filteredTasks.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        
        <button 
          onClick={handleCreateTask}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: '0.15s',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
          }}
        >
          ➕ New Task
        </button>
      </div>

      {/* Filtros en Acordeones */}
      <Accordion 
        title="🔍 Query" 
        defaultOpen={false}
        badges={queryBadges}
        isOpen={queryAccordionOpen}
        onToggle={toggleQueryAccordion}
      >
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
            <input
              type="text"
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              placeholder="🔍 Search"
              value={filterInputs.search || ''}
              onChange={(e) => setFilterInputs((prev: TaskFilters) => ({ ...prev, search: e.target.value || undefined }))}
            />

            <select
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              value={queryFilters.status || ''}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, status: (e.target.value || undefined) as TaskStatus | undefined, page: 1 }))}
            >
              <option value="">Status</option>
              <option value="todo">Todo</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>

            <select
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              value={queryFilters.priority || ''}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, priority: (e.target.value || undefined) as TaskPriority | undefined, page: 1 }))}
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
              value={queryFilters.tag || ''}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, tag: e.target.value || undefined, page: 1 }))}
            />

            <input
              type="date"
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              placeholder="Created from"
              value={queryFilters.created_from ? new Date(queryFilters.created_from).toISOString().split('T')[0] : ''}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, created_from: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
            />

            <input
              type="date"
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              placeholder="Created to"
              value={queryFilters.created_to ? new Date(queryFilters.created_to).toISOString().split('T')[0] : ''}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, created_to: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
            />

            <input
              type="date"
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              placeholder="Due from"
              value={queryFilters.due_from ? new Date(queryFilters.due_from).toISOString().split('T')[0] : ''}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, due_from: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
            />

            <input
              type="date"
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              placeholder="Due to"
              value={queryFilters.due_to ? new Date(queryFilters.due_to).toISOString().split('T')[0] : ''}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, due_to: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
            />

            <select
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              value={queryFilters.sort_by || 'created_at'}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, sort_by: e.target.value as any }))}
            >
              <option value="created_at">Sort: Created</option>
              <option value="updated_at">Sort: Updated</option>
              <option value="due_date">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="title">Sort: Title</option>
            </select>

            <select
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              value={queryFilters.sort_order || 'desc'}
              onChange={(e) => setQueryFilters((prev: TaskFilters) => ({ ...prev, sort_order: e.target.value as 'asc' | 'desc' }))}
            >
              <option value="desc">↓ Desc</option>
              <option value="asc">↑ Asc</option>
            </select>
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={handleResetQueryFilters}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: '0.15s',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
              }}
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              disabled={isFetching}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.25rem',
                border: 'none',
                backgroundColor: isFetching ? '#9ca3af' : '#3b82f6',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isFetching ? 'not-allowed' : 'pointer',
                transition: '0.15s',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
              }}
            >
              {isFetching ? 'Loading...' : '🔍 Search'}
            </button>
          </div>
        </div>
      </Accordion>

      <Accordion 
        title="🎛️ Filters" 
        defaultOpen={false}
        badges={filterBadges}
        isOpen={filtersAccordionOpen}
        onToggle={toggleFiltersAccordion}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          {/* Group By */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
              Group by
            </label>
            <select
              className="input"
              style={{ fontSize: 12, padding: '6px' }}
              value={localFilters.groupBy}
              onChange={(e) => setLocalFilters((prev: LocalFilters) => ({ ...prev, groupBy: e.target.value as LocalFilters['groupBy'] }))}
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
              value={localFilters.sortBy}
              onChange={(e) => setLocalFilters((prev: LocalFilters) => ({ ...prev, sortBy: e.target.value as LocalFilters['sortBy'] }))}
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
              onClick={() => setLocalFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: '0.15s',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                width: '100%'
              }}
              title={localFilters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {localFilters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
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
              value={localFilters.dateFilter}
              onChange={(e) => setLocalFilters((prev: LocalFilters) => ({ ...prev, dateFilter: e.target.value as LocalFilters['dateFilter'] }))}
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
                  checked={localFilters.showCompleted}
                  onChange={(e) => setLocalFilters((prev: LocalFilters) => ({ ...prev, showCompleted: e.target.checked }))}
                  style={{ margin: 0, transform: 'scale(0.8)' }}
                />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Done</span>
              </label>
              
              <button 
                onClick={() => setLocalFilters({
                  groupBy: 'none',
                  sortBy: 'created_at',
                  sortOrder: 'desc',
                  dateFilter: 'all',
                  showCompleted: true,
                })} 
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: '0.15s',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
                }}
                title="Reset filters"
              >
                <svg style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.15rem' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        {localFilters.dateFilter === 'custom' && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                  Date from
                </label>
                <input
                  type="date"
                  className="input"
                  value={localFilters.customDateFrom || ''}
                  onChange={(e) => setLocalFilters((prev: LocalFilters) => ({ ...prev, customDateFrom: e.target.value || undefined }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                  Date to
                </label>
                <input
                  type="date"
                  className="input"
                  value={localFilters.customDateTo || ''}
                  onChange={(e) => setLocalFilters((prev: LocalFilters) => ({ ...prev, customDateTo: e.target.value || undefined }))}
                />
              </div>
            </div>
          </div>
        )}
      </Accordion>

      {/* Controles de Paginación */}
      <div className="pagination-container" style={{ 
        marginBottom: '0.25rem', 
        padding: '0.5rem 0.75rem', 
        border: '1px solid var(--color-border)', 
        borderRadius: '0.375rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        minHeight: '2rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Columna Izquierda - Info de elementos mostrados */}
        <div style={{ flex: '1', display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {total > 0 ? (
              `${Math.min((currentPage - 1) * (appliedFilters.limit || 10) + 1, total)}-${Math.min(currentPage * (appliedFilters.limit || 10), total)} of ${total}`
            ) : (
              'No tasks'
            )}
          </span>
        </div>
        
        {/* Columna Derecha - Controles */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Selector de elementos por página */}
          <select
            value={appliedFilters.limit || 10}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value);
              const newFilters = { ...appliedFilters, limit: newLimit, page: 1 };
              setAppliedFilters(newFilters);
              setFilterInputs(newFilters);
            }}
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.125rem 0.25rem', 
              border: '1px solid var(--color-border)', 
              borderRadius: '0.25rem',
              width: '3rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          
          {/* Navegación de páginas */}
          {totalPages > 1 && (
            <>
              <button
                onClick={() => {
                  const newFilters = { ...appliedFilters, page: Math.max(1, currentPage - 1) };
                  setAppliedFilters(newFilters);
                  setFilterInputs(newFilters);
                }}
                disabled={currentPage === 1}
                style={{ 
                  padding: '0.125rem 0.25rem',
                  fontSize: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.25rem',
                  backgroundColor: currentPage === 1 ? 'var(--color-bg-alt)' : 'var(--color-surface)',
                  color: currentPage === 1 ? 'var(--color-text-secondary)' : 'var(--color-text)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
                title="Previous"
              >
                ‹
              </button>
              
              <span style={{ color: 'var(--color-text)', padding: '0 0.25rem', whiteSpace: 'nowrap' }}>
                {currentPage}/{totalPages}
              </span>
              
              <button
                onClick={() => {
                  const newFilters = { ...appliedFilters, page: Math.min(totalPages, currentPage + 1) };
                  setAppliedFilters(newFilters);
                  setFilterInputs(newFilters);
                }}
                disabled={currentPage === totalPages}
                style={{ 
                  padding: '0.125rem 0.25rem',
                  fontSize: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.25rem',
                  backgroundColor: currentPage === totalPages ? 'var(--color-bg-alt)' : 'var(--color-surface)',
                  color: currentPage === totalPages ? 'var(--color-text-secondary)' : 'var(--color-text)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
                title="Next"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tasks Display */}
      {filteredTasks.length === 0 ? (
        <div className="content-section" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: '24rem', margin: '0 auto' }}>
            <svg
              style={{ height: '4rem', width: '4rem', color: '#6b7280', margin: '0 auto 1rem auto' }}
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
            
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>No visible tasks</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {rawTasks.length === 0 
                ? 'Start by creating your first task.' 
                : 'Try adjusting the filters to see more tasks.'}
            </p>
            
            <button 
              onClick={handleCreateTask}
              className="btn btn-primary"
            >
              Create First Task
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          height: '60vh', 
          overflowY: 'auto', 
          border: '1px solid var(--color-border)', 
          borderRadius: '0.5rem',
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '1rem',
          boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Render tasks based on view mode */}
          {viewMode === 'grid' && (
            <TaskGroupView
              groupedTasks={groupedTasks}
              onEditTask={handleEditTask}
            />
          )}
          
          {viewMode === 'list' && (
            <TaskListView
              tasks={filteredTasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTaskById}
              onStatusChange={handleStatusChange}
            />
          )}
          
          {viewMode === 'kanban' && (
            <TaskKanbanView
              tasks={filteredTasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTaskById}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />

      {/* Loading indicator */}
      {isFetching && (
        <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', backgroundColor: '#3b82f6', color: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }}></div>
            Updating...
          </div>
        </div>
      )}
    </div>
  );
};