import React, { useState } from 'react';
import type { Task } from '../../types/index';
import { useDeleteTask } from '../../hooks/useTasks';
import { ConfirmModal } from '../UI/ConfirmModal';

interface TaskListViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: 'todo' | 'doing' | 'done') => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ 
  tasks, 
  onEditTask, 
  onDeleteTask: originalOnDeleteTask, 
  onStatusChange 
}) => {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; task: Task | null }>({
    isOpen: false,
    task: null,
  });
  
  const deleteTaskMutation = useDeleteTask();

  const handleDeleteClick = (task: Task) => {
    setDeleteModal({ isOpen: true, task });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.task) {
      try {
        await deleteTaskMutation.mutateAsync(deleteModal.task.id);
        originalOnDeleteTask(deleteModal.task.id);
        setDeleteModal({ isOpen: false, task: null });
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, task: null });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return '#ef4444';
      case 'doing': return '#f59e0b';
      case 'done': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'med': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (tasks.length === 0) {
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center', 
        color: '#6b7280',
        fontSize: '1.125rem'
      }}>
        No tasks to display
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 120px',
        gap: '1rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#374151'
      }}>
        <div>Tarea</div>
        <div>Estado</div>
        <div>Prioridad</div>
        <div>Etiquetas</div>
        <div>Creado</div>
        <div>Acciones</div>
      </div>

      {/* Tasks */}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 120px',
            gap: '1rem',
            padding: '1rem',
            borderBottom: '1px solid #f3f4f6',
            alignItems: 'center',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {/* Title and Description */}
          <div style={{ minWidth: 0 }}>
            <h4 style={{ 
              margin: '0 0 0.25rem 0', 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {task.title}
            </h4>
            {task.description && (
              <p style={{ 
                margin: 0, 
                fontSize: '0.75rem', 
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {task.description}
              </p>
            )}
            {task.due_date && (
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                fontSize: '0.75rem', 
                color: new Date(task.due_date) < new Date() ? '#dc2626' : '#6b7280',
                fontWeight: new Date(task.due_date) < new Date() ? '500' : '400'
              }}>
                📅 {formatDate(task.due_date)}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as 'todo' | 'doing' | 'done')}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.75rem',
                backgroundColor: '#ffffff',
                color: getStatusColor(task.status),
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="todo">📋 Todo</option>
              <option value="doing">⚡ Doing</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <span style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              backgroundColor: `${getPriorityColor(task.priority)}20`,
              color: getPriorityColor(task.priority)
            }}>
              {task.priority === 'high' ? '🔴 Alta' : 
               task.priority === 'med' ? '🟡 Media' : 
               '🟢 Baja'}
            </span>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {task.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                style={{
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.625rem',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  fontWeight: '500'
                }}
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span style={{
                fontSize: '0.625rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                +{task.tags.length - 2}
              </span>
            )}
          </div>

          {/* Created Date */}
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {formatDate(task.created_at)}
          </div>

          {/* Actions */}
          <div className="task-actions">
            <button
              onClick={() => onEditTask(task)}
              className="task-action-btn edit"
              title="Editar tarea"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => handleDeleteClick(task)}
              className="task-action-btn delete"
              title="Eliminar tarea"
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending && deleteModal.task?.id === task.id ? (
                <span className="spinner" style={{ width: '0.75rem', height: '0.75rem' }}></span>
              ) : (
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h1a1 1 0 000 2H6a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1h-1a1 1 0 100-2h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={deleteModal.task ? `Are you sure you want to delete "${deleteModal.task.title}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteTaskMutation.isPending}
      />
    </div>
  );
};
