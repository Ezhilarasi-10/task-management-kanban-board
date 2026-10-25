import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../components/TaskCard';
import { Task } from '../types';

describe('TaskCard Component', () => {
  const sampleTask: Task = {
    id: 101,
    title: 'Deploy Production Release',
    description: 'Push verified build to hosting server',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-12-15',
    created_at: '2026-10-25T10:00:00Z',
    updated_at: '2026-10-25T10:00:00Z',
  };

  it('renders task details correctly', () => {
    render(
      <TaskCard
        task={sampleTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('Deploy Production Release')).toBeInTheDocument();
    expect(screen.getByText('Push verified build to hosting server')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Dec 15, 2026')).toBeInTheDocument();
  });

  it('displays overdue warning badge when due date is in the past and status is not done', () => {
    const overdueTask: Task = {
      ...sampleTask,
      due_date: '2020-01-01', // definitely in the past
      status: 'todo',
    };

    render(
      <TaskCard
        task={overdueTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('(Overdue)')).toBeInTheDocument();
  });

  it('does not mark completed tasks as overdue even if due date is in the past', () => {
    const completedPastTask: Task = {
      ...sampleTask,
      due_date: '2020-01-01',
      status: 'done',
    };

    render(
      <TaskCard
        task={completedPastTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.queryByText('(Overdue)')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = vi.fn();
    render(
      <TaskCard
        task={sampleTask}
        onEdit={handleEdit}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    const editBtn = screen.getByLabelText(/Edit Deploy Production Release/i);
    fireEvent.click(editBtn);

    expect(handleEdit).toHaveBeenCalledWith(sampleTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = vi.fn();
    render(
      <TaskCard
        task={sampleTask}
        onEdit={vi.fn()}
        onDelete={handleDelete}
        onStatusChange={vi.fn()}
      />
    );

    const deleteBtn = screen.getByLabelText(/Delete Deploy Production Release/i);
    fireEvent.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith(sampleTask);
  });

  it('calls onStatusChange when the accessible status dropdown is changed', () => {
    const handleStatusChange = vi.fn();
    render(
      <TaskCard
        task={sampleTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={handleStatusChange}
      />
    );

    const select = screen.getByLabelText(/Move task Deploy Production Release to another stage/i);
    fireEvent.change(select, { target: { value: 'done' } });

    expect(handleStatusChange).toHaveBeenCalledWith(101, 'done');
  });

  it('is draggable with proper drag attributes', () => {
    const { container } = render(
      <TaskCard
        task={sampleTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    const card = container.querySelector('.task-card');
    expect(card).toHaveAttribute('draggable', 'true');
  });
});
