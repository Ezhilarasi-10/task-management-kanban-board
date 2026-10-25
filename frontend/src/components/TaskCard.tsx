import React from 'react';
import { 
  Calendar, 
  Trash2, 
  Edit3, 
  GripVertical, 
  AlertTriangle,
  MoveRight
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  isUpdating?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdating = false,
}) => {
  // Drag start handler
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('is-dragging');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('is-dragging');
  };

  // Check if task is overdue
  const isOverdue = (): boolean => {
    if (!task.due_date || task.status === 'done') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date < today;
  };

  // Format date display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No due date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const priorityLabels: Record<TaskPriority, { label: string; class: string }> = {
    high: { label: 'High Priority', class: 'badge-high' },
    medium: { label: 'Medium Priority', class: 'badge-medium' },
    low: { label: 'Low Priority', class: 'badge-low' },
  };

  const overdue = isOverdue();

  return (
    <div
      className={`task-card ${isUpdating ? 'card-updating' : ''} ${overdue ? 'card-overdue' : ''}`}
      draggable={!isUpdating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-task-id={task.id}
      tabIndex={0}
      aria-label={`Task: ${task.title}. Priority: ${task.priority}. Status: ${task.status}.`}
    >
      {/* Drag handle and header actions */}
      <div className="task-card-top">
        <div className="drag-handle-wrapper" title="Drag to move column">
          <GripVertical size={16} className="drag-icon" />
          <span className={`priority-badge ${priorityLabels[task.priority].class}`}>
            {priorityLabels[task.priority].label}
          </span>
        </div>

        <div className="task-actions-group">
          <button
            type="button"
            className="card-action-btn edit"
            onClick={() => onEdit(task)}
            title="Edit task details"
            aria-label={`Edit ${task.title}`}
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            className="card-action-btn delete"
            onClick={() => onDelete(task)}
            title="Delete task"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="task-card-title">{task.title}</h3>

      {/* Description */}
      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {/* Due Date & Overdue Tag */}
      <div className="task-card-meta">
        <div className={`date-badge ${overdue ? 'overdue' : ''}`}>
          {overdue ? <AlertTriangle size={14} className="overdue-icon" /> : <Calendar size={14} />}
          <span>{formatDate(task.due_date)}</span>
          {overdue && <span className="overdue-text">(Overdue)</span>}
        </div>
      </div>

      {/* Accessible status changer (Alternative to drag and drop) */}
      <div className="card-status-selector-row">
        <label htmlFor={`status-select-${task.id}`} className="status-selector-label">
          <MoveRight size={13} />
          <span>Move:</span>
        </label>
        <select
          id={`status-select-${task.id}`}
          className="accessible-status-dropdown"
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          disabled={isUpdating}
          aria-label={`Move task ${task.title} to another stage`}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
};
