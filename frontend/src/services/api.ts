/**
 * Centralized API service for communicating with the Express backend
 */

import { Task, TaskCreateInput, TaskUpdateInput, TaskStats, FilterState, TaskStatus } from '../types';

// Default to backend port 5000, or override via VITE_API_BASE_URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || `Request failed with status ${response.status} (${response.statusText})`;
      throw new ApiError(errorMessage, response.status);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Network error or backend unreachable.';
    throw new ApiError(message);
  }
}

export const api = {
  /**
   * Health check to detect backend connectivity
   */
  async checkHealth(): Promise<{ status: string; database: string }> {
    return request<{ status: string; database: string }>('/health');
  },

  /**
   * Fetch all tasks with optional search, filtering, and sorting
   */
  async getTasks(filters?: Partial<FilterState>): Promise<Task[]> {
    const params = new URLSearchParams();

    if (filters?.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      params.append('priority', filters.priority);
    }
    if (filters?.sort) {
      params.append('sort', filters.sort);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ success: boolean; data: Task[] }>(`/api/tasks${queryString}`);
    return res.data;
  },

  /**
   * Fetch aggregated dashboard statistics
   */
  async getStats(): Promise<TaskStats> {
    const res = await request<{ success: boolean; data: TaskStats }>('/api/tasks/stats');
    return res.data;
  },

  /**
   * Fetch single task details
   */
  async getTask(id: number): Promise<Task> {
    const res = await request<{ success: boolean; data: Task }>(`/api/tasks/${id}`);
    return res.data;
  },

  /**
   * Create a new task
   */
  async createTask(input: TaskCreateInput): Promise<Task> {
    const res = await request<{ success: boolean; message: string; data: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  /**
   * Update all fields of an existing task
   */
  async updateTask(id: number, input: TaskUpdateInput): Promise<Task> {
    const res = await request<{ success: boolean; message: string; data: Task }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  /**
   * Fast status update (Drag-and-drop & status picker)
   */
  async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    const res = await request<{ success: boolean; message: string; data: Task }>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  /**
   * Delete a task by ID
   */
  async deleteTask(id: number): Promise<void> {
    await request<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reset database to default sample tasks for demonstration
   */
  async resetSampleTasks(): Promise<Task[]> {
    const res = await request<{ success: boolean; message: string; data: Task[] }>('/api/tasks/reset', {
      method: 'POST',
    });
    return res.data;
  },
};
