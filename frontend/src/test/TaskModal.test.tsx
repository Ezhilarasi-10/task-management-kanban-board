import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskModal } from '../components/TaskModal';
import { Task } from '../types';

describe('TaskModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <TaskModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders creation form inputs when open', () => {
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Create New Task' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Initial Column/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Task/i })).toBeInTheDocument();
  });

  it('validates empty title and prevents submission', async () => {
    const handleSubmit = vi.fn();
    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Create Task/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Task title is required and cannot be empty.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with entered task data when valid', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Task Title/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: 'Frontend Unit Test Task' } });
    fireEvent.change(descInput, { target: { value: 'Writing tests for components' } });

    // Select High priority
    const highPriorityBtn = screen.getByRole('radio', { name: /High/i });
    fireEvent.click(highPriorityBtn);

    const submitBtn = screen.getByRole('button', { name: /Create Task/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Frontend Unit Test Task',
        description: 'Writing tests for components',
        priority: 'high',
        status: 'todo',
        due_date: null,
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('pre-populates fields in edit mode and updates task', async () => {
    const mockTask: Task = {
      id: 42,
      title: 'Existing Task to Edit',
      description: 'Initial description',
      status: 'in_progress',
      priority: 'medium',
      due_date: '2026-11-20',
      created_at: '2026-10-25',
      updated_at: '2026-10-25',
    };

    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        taskToEdit={mockTask}
      />
    );

    expect(screen.getByRole('heading', { name: 'Edit Task' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Task to Edit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-11-20')).toBeInTheDocument();

    const updateBtn = screen.getByRole('button', { name: /Update Task/i });
    expect(updateBtn).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <TaskModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
