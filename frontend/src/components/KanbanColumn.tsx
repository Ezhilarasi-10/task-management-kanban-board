import React, { useState } from 'react';
import { Plus, Inbox } from 'lucide-react';
import { ColumnDefinition, Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  column: ColumnDefinition;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onQuickAddTask: (columnStatus: TaskStatus) => void;
  updatingTaskId: number | null;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onQuickAddTask,
  updatingTaskId,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag over handler
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  // Drag leave handler
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only toggle if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr, 10);
    if (!isNaN(taskId)) {
      onStatusChange(taskId, column.id);
    }
  };

  return (
    <section
      className={`kanban-column column-${column.id} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`${column.title} column with ${tasks.length} tasks`}
    >
      {/* Column Header */}
      <div className="column-header">
        <div className="column-header-info">
          <span className={`status-indicator-circle ${column.id}`} />
          <h2 className="column-title">{column.title}</h2>
          <span className="column-count-badge" title={`${tasks.length} tasks`}>
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          className="btn-quick-add"
          onClick={() => onQuickAddTask(column.id)}
          title={`Add new task to ${column.title}`}
          aria-label={`Add task to ${column.title}`}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="column-subtitle">{column.subtitle}</div>

      {/* Task List / Drop Zone */}
      <div className="column-tasks-container">
        {tasks.length === 0 ? (
          <div className="column-empty-state">
            <Inbox size={32} className="empty-icon" />
            <p className="empty-title">No tasks in {column.title}</p>
            <p className="empty-desc">Drop tasks here or click below to create one.</p>
            <button
              type="button"
              className="btn-empty-add"
              onClick={() => onQuickAddTask(column.id)}
            >
              <Plus size={14} />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              isUpdating={updatingTaskId === task.id}
            />
          ))
        )}
      </div>
    </section>
  );
};
