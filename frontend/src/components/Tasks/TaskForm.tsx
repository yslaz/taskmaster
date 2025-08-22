import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '../../types/index';
import { TagInput } from '../UI/TagInput';
import { DatePicker } from '../UI/DatePicker';

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  tags: string[];
}

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEditMode = !!task;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'med',
      due_date: task?.due_date || '',
      tags: (task?.tags && Array.isArray(task.tags)) ? task.tags : [],
    },
  });

  // Watch tags and due_date for controlled components
  const watchedTags = watch('tags');
  const watchedDueDate = watch('due_date');

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
        tags: (task.tags && Array.isArray(task.tags)) ? task.tags : [],
      });
    }
  }, [task, reset]);

  const onFormSubmit = (data: TaskFormData) => {
    const formData: CreateTaskRequest | UpdateTaskRequest = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      due_date: data.due_date || undefined,
      tags: data.tags.length > 0 ? data.tags : undefined,
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Title */}
      <div className="form-group">
        <label htmlFor="title" className="label required">
          Title
        </label>
        <input
          {...register('title', {
            required: 'Title is required',
            minLength: {
              value: 3,
              message: 'Title must be at least 3 characters',
            },
            maxLength: {
              value: 120,
              message: 'Title must be less than 120 characters',
            },
          })}
          type="text"
          id="title"
          className={`input ${errors.title ? 'error' : ''}`}
          placeholder="Enter task title"
          disabled={isLoading}
        />
        {errors.title && (
          <div className="form-error">{errors.title.message}</div>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          className="input textarea"
          placeholder="Enter task description (optional)"
          disabled={isLoading}
        />
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="status" className="label">
            Status
          </label>
          <select
            {...register('status')}
            id="status"
            className="select"
            disabled={isLoading}
          >
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority" className="label">
            Priority
          </label>
          <select
            {...register('priority')}
            id="priority"
            className="select"
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Due Date */}
      <div className="form-group">
        <label htmlFor="due_date" className="label">
          Due Date
        </label>
        <DatePicker
          value={watchedDueDate}
          onChange={(date) => setValue('due_date', date)}
          placeholder="Select due date (optional)"
          disabled={isLoading}
          minDate={new Date().toISOString().split('T')[0]} // Today or later
        />
      </div>

      {/* Tags */}
      <div className="form-group">
        <label className="label">
          Tags
        </label>
        <TagInput
          tags={watchedTags}
          onTagsChange={(tags) => setValue('tags', tags)}
          placeholder="Add tags to organize your task"
          disabled={isLoading}
          maxTags={5}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          className="btn btn-primary flex-1 sm:flex-none"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner mr-2"></span>
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditMode ? 'Update Task' : 'Create Task'
          )}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1 sm:flex-none"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};