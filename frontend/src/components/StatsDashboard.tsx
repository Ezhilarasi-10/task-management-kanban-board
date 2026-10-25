import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { TaskStats } from '../types';

interface StatsDashboardProps {
  stats: TaskStats | null;
  isLoading: boolean;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, isLoading }) => {
  if (isLoading && !stats) {
    return (
      <div className="stats-grid-skeleton" aria-label="Loading stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card skeleton-card" />
        ))}
      </div>
    );
  }

  const {
    total = 0,
    completed = 0,
    in_progress = 0,
    pending = 0,
    completion_rate = 0,
    by_priority = { low: 0, medium: 0, high: 0 },
    overdue = 0,
  } = stats || {};

  return (
    <div className="dashboard-stats-wrapper">
      <div className="stats-grid">
        {/* Total Tasks */}
        <div className="stat-card card-total">
          <div className="stat-header">
            <span className="stat-label">Total Tasks</span>
            <div className="stat-icon-pill icon-total">
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-meta">
            <span>Overall project workload</span>
          </div>
        </div>

        {/* Pending / To Do */}
        <div className="stat-card card-pending">
          <div className="stat-header">
            <span className="stat-label">To Do (Pending)</span>
            <div className="stat-icon-pill icon-pending">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="stat-value">{pending}</div>
          <div className="stat-meta">
            <span>Tasks awaiting action</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="stat-card card-progress">
          <div className="stat-header">
            <span className="stat-label">In Progress</span>
            <div className="stat-icon-pill icon-progress">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">{in_progress}</div>
          <div className="stat-meta">
            <span>Actively being worked on</span>
          </div>
        </div>

        {/* Completed */}
        <div className="stat-card card-completed">
          <div className="stat-header">
            <span className="stat-label">Completed</span>
            <div className="stat-icon-pill icon-completed">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value">{completed}</div>
          <div className="stat-meta">
            <span className="completion-badge">{completion_rate}% finished</span>
          </div>
        </div>
      </div>

      {/* Progress & Priority Breakdown Strip */}
      <div className="stats-summary-strip">
        <div className="progress-section">
          <div className="progress-label-row">
            <div className="progress-title">
              <TrendingUp size={16} />
              <span>Project Completion Progress</span>
            </div>
            <span className="progress-percent">{completion_rate}%</span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={completion_rate} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(100, Math.max(0, completion_rate))}%` }} 
            />
          </div>
        </div>

        <div className="priority-summary-section">
          <span className="priority-section-title">Priority Distribution:</span>
          <div className="priority-pills-row">
            <span className="priority-pill pill-high" title="High Priority Tasks">
              <span className="dot" /> High: <strong>{by_priority.high}</strong>
            </span>
            <span className="priority-pill pill-medium" title="Medium Priority Tasks">
              <span className="dot" /> Med: <strong>{by_priority.medium}</strong>
            </span>
            <span className="priority-pill pill-low" title="Low Priority Tasks">
              <span className="dot" /> Low: <strong>{by_priority.low}</strong>
            </span>
            {overdue > 0 && (
              <span className="priority-pill pill-overdue" title="Overdue Tasks">
                <AlertTriangle size={13} /> Overdue: <strong>{overdue}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
