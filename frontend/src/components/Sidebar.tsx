import React from 'react';
import { 
  Kanban, 
  BarChart3, 
  GraduationCap, 
  RotateCcw, 
  Plus, 
  Database,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'board' | 'analytics' | 'viva';
  setActiveTab: (tab: 'board' | 'analytics' | 'viva') => void;
  backendOnline: boolean | null;
  onOpenNewTaskModal: () => void;
  onResetSampleData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  backendOnline,
  onOpenNewTaskModal,
  onResetSampleData,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {isOpenMobile && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile} 
          aria-hidden="true" 
        />
      )}
      <aside className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="brand-icon-box">
              <Kanban className="brand-icon" size={22} />
            </div>
            <div className="brand-text">
              <span className="brand-name">TaskFlow</span>
              <span className="brand-tag">Kanban Board</span>
            </div>
          </div>
          {isOpenMobile && (
            <button 
              type="button" 
              className="sidebar-close-btn" 
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-action">
          <button 
            type="button" 
            className="btn-create-task"
            onClick={() => {
              onOpenNewTaskModal();
              if (isOpenMobile) onCloseMobile();
            }}
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          <button
            type="button"
            className={`nav-item ${activeTab === 'board' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('board');
              if (isOpenMobile) onCloseMobile();
            }}
          >
            <Kanban size={18} />
            <span>Kanban Board</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('analytics');
              if (isOpenMobile) onCloseMobile();
            }}
          >
            <BarChart3 size={18} />
            <span>Analytics & Stats</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'viva' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('viva');
              if (isOpenMobile) onCloseMobile();
            }}
          >
            <GraduationCap size={18} />
            <span>Viva & System Guide</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Quick Demo Reset */}
          <button
            type="button"
            className="btn-reset-demo"
            onClick={() => {
              onResetSampleData();
              if (isOpenMobile) onCloseMobile();
            }}
            title="Reset database with standard demo tasks for presentations"
          >
            <RotateCcw size={15} />
            <span>Reset Demo Tasks</span>
          </button>

          {/* Backend Connection Indicator */}
          <div className="connection-status-card">
            <div className="status-indicator-row">
              <span className={`status-dot ${backendOnline ? 'online' : backendOnline === false ? 'offline' : 'checking'}`} />
              <span className="status-label">
                {backendOnline === true && 'API Online (Port 5000)'}
                {backendOnline === false && 'API Disconnected'}
                {backendOnline === null && 'Connecting to API...'}
              </span>
            </div>
            <div className="db-badge">
              <Database size={13} />
              <span>SQLite Persistent DB</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
