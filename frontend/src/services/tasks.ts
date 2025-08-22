import { apiClient } from './api';
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters, TasksResponse } from '../types/index';

export const tasksService = {
  async getTasks(filters?: TaskFilters): Promise<TasksResponse> {
    return apiClient.get<TasksResponse>('/tasks', filters);
  },

  async getTask(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    return apiClient.post<Task>('/tasks', taskData);
  },

  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<Task> {
    return apiClient.put<Task>(`/tasks/${id}`, taskData);
  },

  async deleteTask(id: string): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(`/tasks/${id}`);
  },
};