// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, any>;
  };
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Task types
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'med' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  created_from?: string;
  created_to?: string;
  due_from?: string;
  due_to?: string;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}