import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '../services/tasks';
import type { TaskFilters, Task, CreateTaskRequest, UpdateTaskRequest } from '../types/index';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => {
    // Normalize filters to ensure consistent query keys
    const normalizedFilters = {
      ...filters,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
    return [...taskKeys.lists(), normalizedFilters] as const;
  },
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Hook for fetching tasks with filters
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => tasksService.getTasks(filters),
    staleTime: 5 * 1000, // 5 seconds - more frequent updates
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });
}

// Hook for fetching a single task
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksService.getTask(id),
    enabled: !!id,
  });
}

// Hook for creating a task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: CreateTaskRequest) => tasksService.createTask(taskData),
    onSuccess: (newTask) => {
      console.log('✅ Task created successfully:', newTask);
      // Invalidate all task lists to ensure the new task appears
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // Also invalidate the 'all' queries to catch any other patterns
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      console.log('🔄 Invalidated task queries after creation');
      
      // Also add the new task to all existing caches optimistically
      queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: [newTask, ...old.data], // Add new task at the beginning
        };
      });
      
      // Force a refetch to ensure consistency
      queryClient.refetchQueries({ queryKey: taskKeys.lists() });
      console.log('🔄 Refetched task queries after creation');
    },
  });
}

// Hook for updating a task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      tasksService.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update all task lists in cache
      queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((task: Task) => 
            task.id === id 
              ? { ...task, ...data, updated_at: new Date().toISOString() }
              : task
          )
        };
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedTask) => {
      console.log('✅ Task updated successfully:', updatedTask);
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
    },
    onSettled: () => {
      console.log('🔄 Settling task update - invalidating queries');
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // Also invalidate the 'all' queries to catch any other patterns
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Hook for deleting a task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksService.deleteTask(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // Also invalidate the 'all' queries to catch any other patterns
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      
      // Remove the deleted task from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
    },
  });
}

// Hook for managing task filters state
export function useTaskFilters() {
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 10,
  });

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change (except for page itself)
      ...(key !== 'page' ? { page: 1 } : {}),
    }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
  };
}