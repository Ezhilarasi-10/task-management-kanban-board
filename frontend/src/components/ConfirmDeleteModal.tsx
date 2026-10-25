import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Task } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirm: (taskId: number) => Promise<void>;
  isDeleting: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  task,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !task) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="delete-icon-badge">
            <AlertTriangle size={22} className="warning-icon" />
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="delete-body">
          <h2 id="delete-dialog-title" className="delete-title">
            Delete Task?
          </h2>
          <p id="delete-dialog-description" className="delete-warning-text">
            Are you sure you want to delete <strong className="task-highlight">&ldquo;{task.title}&rdquo;</strong>?
            This will permanently remove the record from the SQLite database.
          </p>

          <div className="delete-task-preview-card">
            <div className="preview-label">Task details:</div>
            <div className="preview-title">{task.title}</div>
            <div className="preview-meta">
              <span className={`preview-badge badge-${task.priority}`}>{task.priority} priority</span>
              <span className="preview-status">Status: {task.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-delete-confirm"
            onClick={() => onConfirm(task.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
