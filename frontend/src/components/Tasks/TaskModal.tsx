import React from 'react';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../../types/index';
import { useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { Modal } from '../UI/Modal';
import { TaskForm } from './TaskForm';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  
  const isEditMode = !!task;
  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending;

  const handleSubmit = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    try {
      if (isEditMode && task) {
        await updateTaskMutation.mutateAsync({
          id: task.id,
          data: data as UpdateTaskRequest,
        });
      } else {
        await createTaskMutation.mutateAsync(data as CreateTaskRequest);
      }
      
      onClose();
    } catch (error) {
      // Error is handled by React Query and can be displayed via error state
      console.error('Failed to save task:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Task' : 'Create New Task'}
      size="lg"
      showCloseButton={!isLoading}
    >
      <TaskForm
        task={task}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
      />

      {/* Error Messages */}
      {createTaskMutation.error && (
        <div className="alert alert-error mt-4">
          Failed to create task: {(createTaskMutation.error as Error).message}
        </div>
      )}
      
      {updateTaskMutation.error && (
        <div className="alert alert-error mt-4">
          Failed to update task: {(updateTaskMutation.error as Error).message}
        </div>
      )}
    </Modal>
  );
};