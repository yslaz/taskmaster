import React, { useState } from 'react';
import type { Task } from '../../types/index';
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { ConfirmModal } from '../UI/ConfirmModal';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      setShowDeleteModal(false);
    } catch (error) {
      // Error handling is managed by React Query
      console.error('Failed to delete task:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== 'done';
  };

  const overdue = isOverdue(task.due_date);

  // Top border color based on priority
  const getPriorityBorderColor = () => {
    switch (task.priority) {
      case 'high': return '#dc2626';
      case 'med': return '#d97706';
      case 'low': return '#059669';
      default: return '#e5e7eb';
    }
  };

  return (
    <div className="card" style={{ 
      backgroundColor: 'transparent', 
      padding: '0.75rem',
      borderTop: `3px solid ${getPriorityBorderColor()}`
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div className={`badge badge-status-${task.status}`} style={{ fontSize: '0.6rem', padding: '0.125rem 0.375rem', fontWeight: '700', textTransform: 'uppercase' }}>
            {task.status}
          </div>
          <div className={`badge badge-priority-${task.priority}`} style={{ fontSize: '0.6rem', padding: '0.125rem 0.375rem' }}>
            {task.priority}
          </div>
        </div>
        
        <div className="task-actions">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="task-action-btn edit"
              title="Edit task"
              disabled={updateTaskMutation.isPending || deleteTaskMutation.isPending}
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={handleDeleteClick}
            className="task-action-btn delete"
            title="Delete task"
            disabled={updateTaskMutation.isPending || deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? (
              <span className="spinner" style={{ width: '0.75rem', height: '0.75rem' }}></span>
            ) : (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h1a1 1 0 000 2H6a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1h-1a1 1 0 100-2h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <h3 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem', lineHeight: '1.2' }}>
        {task.title}
      </h3>

      {task.description && (
        <p className="line-clamp-2" style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.375rem', lineHeight: '1.3' }}>
          {task.description}
        </p>
      )}

      {task.due_date && (
        <div style={{ fontSize: '0.7rem', marginBottom: '0.375rem', color: overdue ? '#dc2626' : '#6b7280' }}>
          Due {formatDate(task.due_date)}{overdue && ' (Overdue)'}
        </div>
      )}

      {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.125rem' }}>
          {task.tags.map((tag, index) => (
            <span
              key={index}
              style={{ display: 'inline-block', padding: '0.125rem 0.25rem', fontSize: '0.65rem', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '0.125rem' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {(updateTaskMutation.isPending) && (
        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem' }}>
          <span className="spinner"></span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteTaskMutation.isPending}
      />
    </div>
  );
};