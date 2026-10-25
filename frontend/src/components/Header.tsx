import React from 'react';
import { Menu, Plus, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenNewTaskModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: 'board' | 'analytics' | 'viva';
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenNewTaskModal,
  onRefresh,
  isRefreshing,
  activeTab,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'board':
        return 'Task Management Kanban Board';
      case 'analytics':
        return 'Project Analytics & Performance';
      case 'viva':
        return 'Viva Evaluation & Architecture Guide';
      default:
        return 'Task Management';
    }
  };

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'board':
        return 'Track, organize, and prioritize workflow across stages in real-time';
      case 'analytics':
        return 'Visual statistics and metrics calculated directly from the database';
      case 'viva':
        return 'Technical specifications, database design, and presentation prep';
      default:
        return '';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-titles">
          <h1 className="header-title">{getTabTitle()}</h1>
          <p className="header-subtitle">{getTabSubtitle()}</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className={`btn-secondary-action ${isRefreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh board data"
        >
          <RefreshCw size={16} />
          <span className="btn-label-desktop">Refresh</span>
        </button>

        <button
          type="button"
          className="btn-primary-action"
          onClick={onOpenNewTaskModal}
        >
          <Plus size={18} />
          <span>Add Task</span>
        </button>
      </div>
    </header>
  );
};
