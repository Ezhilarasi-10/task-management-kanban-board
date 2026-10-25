import React from 'react';
import { ColumnDefinition, Task, TaskStatus } from '../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onQuickAddTask: (columnStatus: TaskStatus) => void;
  updatingTaskId: number | null;
}

const COLUMNS: ColumnDefinition[] = [
  {
    id: 'todo',
    title: 'To Do',
    subtitle: 'Backlog & queued items',
    badgeClass: 'badge-todo'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    subtitle: 'Currently being developed',
    badgeClass: 'badge-progress'
  },
  {
    id: 'done',
    title: 'Done',
    subtitle: 'Completed & verified items',
    badgeClass: 'badge-done'
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onQuickAddTask,
  updatingTaskId,
}) => {
  return (
    <div className="kanban-board-grid">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((task) => task.status === col.id);
        return (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={columnTasks}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onStatusChange={onStatusChange}
            onQuickAddTask={onQuickAddTask}
            updatingTaskId={updatingTaskId}
          />
        );
      })}
    </div>
  );
};
