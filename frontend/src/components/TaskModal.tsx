import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, AlertCircle, Sparkles, Check } from 'lucide-react';
import { Task, TaskCreateInput, TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreateInput) => Promise<void>;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskToEdit,
  defaultStatus = 'todo',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Populate or reset form whenever modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setStatus(taskToEdit.status);
        setPriority(taskToEdit.priority);
        setDueDate(taskToEdit.due_date || '');
      } else {
        setTitle('');
        setDescription('');
        setStatus(defaultStatus);
        setPriority('medium');
        setDueDate('');
      }
      setErrors({});
      // Focus title input on open
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, taskToEdit, defaultStatus]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { title?: string; dueDate?: string } = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Task title is required and cannot be empty.';
    } else if (trimmedTitle.length > 200) {
      newErrors.title = 'Task title cannot exceed 200 characters.';
    }

    if (dueDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        newErrors.dueDate = 'Due date must be in YYYY-MM-DD format.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate ? dueDate : null,
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save task. Please try again.';
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-title-box">
            <h2 id="task-modal-title" className="modal-title">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="modal-subtitle">
              {taskToEdit ? 'Update details and stage for this task' : 'Add a new task to your Kanban board'}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {errors.general && (
          <div className="modal-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="task-title" className="form-label">
              Task Title <span className="required-star">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Implement user authentication endpoints"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              maxLength={200}
              required
            />
            <div className="form-input-footer">
              {errors.title ? (
                <span className="field-error-msg">{errors.title}</span>
              ) : (
                <span className="field-hint">A concise summary of the deliverable.</span>
              )}
              <span className="char-counter">{title.length}/200</span>
            </div>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="task-description" className="form-label">
              Description <span className="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="task-description"
              className="form-textarea"
              placeholder="Provide background, requirements, technical notes, or acceptance criteria..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
            <div className="form-input-footer">
              <span className="field-hint">Max 2,000 characters.</span>
              <span className="char-counter">{description.length}/2000</span>
            </div>
          </div>

          {/* Priority & Status Dual Columns */}
          <div className="form-row-dual">
            {/* Priority Radio Buttons */}
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <div className="priority-button-group" role="radiogroup" aria-label="Priority Level">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`btn-priority-choice choice-${p} ${isSelected ? 'selected' : ''}`}
                      onClick={() => setPriority(p)}
                    >
                      <span className="choice-dot" />
                      <span className="choice-text">
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="form-group">
              <label htmlFor="task-status" className="form-label">
                Initial Column / Status
              </label>
              <select
                id="task-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Due Date Field */}
          <div className="form-group">
            <label htmlFor="task-due-date" className="form-label">
              Due Date <span className="optional-tag">(Optional)</span>
            </label>
            <div className="date-input-wrapper">
              <Calendar size={17} className="date-icon" />
              <input
                id="task-due-date"
                type="date"
                className={`form-input date-field ${errors.dueDate ? 'input-error' : ''}`}
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
                }}
              />
              {dueDate && (
                <button
                  type="button"
                  className="clear-date-btn"
                  onClick={() => setDueDate('')}
                  title="Clear date"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {errors.dueDate && <span className="field-error-msg">{errors.dueDate}</span>}
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : taskToEdit ? (
                <>
                  <Check size={16} />
                  <span>Update Task</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
