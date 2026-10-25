/**
 * TypeScript Type Definitions for Task Management Kanban Board
 */

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskSortOption =
  | 'created_at_desc'
  | 'created_at_asc'
  | 'due_date_asc'
  | 'due_date_desc'
  | 'priority_desc'
  | 'priority_asc';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface PriorityBreakdown {
  low: number;
  medium: number;
  high: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  completion_rate: number;
  by_priority: PriorityBreakdown;
  overdue: number;
}

export interface FilterState {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  sort: TaskSortOption;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ColumnDefinition {
  id: TaskStatus;
  title: string;
  subtitle: string;
  badgeClass: string;
}
