import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Task, TaskStats, FilterState, TaskStatus, TaskCreateInput, ToastMessage } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsDashboard } from './components/StatsDashboard';
import { FilterBar } from './components/FilterBar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ToastContainer } from './components/Toast';
import { VivaInfoGuide } from './components/VivaInfoModal';
import './App.css';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  sort: 'created_at_desc',
};

export const App: React.FC = () => {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'board' | 'analytics' | 'viva'>('board');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals & Notifications
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultColumnStatus, setDefaultColumnStatus] = useState<TaskStatus>('todo');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Notification Dispatcher
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Health Check
  const checkServerHealth = useCallback(async () => {
    try {
      await api.checkHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Fetch Tasks with filters
  const fetchTasks = useCallback(async (currentFilters: FilterState) => {
    try {
      const taskList = await api.getTasks(currentFilters);
      setTasks(taskList);
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend server.';
      showToast('error', `Data fetch failed: ${msg}`);
    }
  }, [showToast]);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await api.getStats();
      setStats(statsData);
      setBackendOnline(true);
    } catch {
      // Handled in fetchTasks
    }
  }, []);

  // Full Refresh
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([checkServerHealth(), fetchTasks(filters), fetchStats()]);
    setIsRefreshing(false);
  }, [checkServerHealth, fetchTasks, fetchStats, filters]);

  // Initial Load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([checkServerHealth(), fetchTasks(filters), fetchStats()]);
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  // Debounced/Triggered when filters change
  useEffect(() => {
    fetchTasks(filters);
  }, [filters, fetchTasks]);

  // Filter handlers
  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Status Change Handler (Drag-and-Drop or Accessible Dropdown)
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    setUpdatingTaskId(taskId);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.updateTaskStatus(taskId, newStatus);
      showToast(
        'success',
        `Moved "${currentTask.title}" to ${newStatus === 'in_progress' ? 'In Progress' : newStatus === 'todo' ? 'To Do' : 'Done'}`
      );
      // Refresh real stats from DB
      await fetchStats();
    } catch (err) {
      // Revert optimistic update on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: currentTask.status } : t))
      );
      const msg = err instanceof Error ? err.message : 'Could not update task status.';
      showToast('error', msg);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Open Create Task Modal
  const handleOpenCreateModal = (columnStatus: TaskStatus = 'todo') => {
    setTaskToEdit(null);
    setDefaultColumnStatus(columnStatus);
    setTaskModalOpen(true);
  };

  // Open Edit Task Modal
  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  // Save Task (Create or Edit)
  const handleSaveTask = async (input: TaskCreateInput) => {
    if (taskToEdit) {
      // Update
      const updated = await api.updateTask(taskToEdit.id, input);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast('success', `Task "${updated.title}" updated successfully.`);
    } else {
      // Create
      const created = await api.createTask(input);
      setTasks((prev) => [created, ...prev]);
      showToast('success', `Task "${created.title}" created successfully.`);
    }
    // Refresh stats from database
    await fetchStats();
  };

  // Confirm Delete
  const handleConfirmDelete = async (taskId: number) => {
    setIsDeleting(true);
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('success', 'Task removed from database permanently.');
      setDeleteModalOpen(false);
      setTaskToDelete(null);
      await fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task.';
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset Sample Tasks for Viva Demo
  const handleResetSampleData = async () => {
    try {
      setIsRefreshing(true);
      await api.resetSampleTasks();
      await Promise.all([fetchTasks(DEFAULT_FILTERS), fetchStats()]);
      setFilters(DEFAULT_FILTERS);
      showToast('info', 'Database reset to default presentation tasks.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reset failed.';
      showToast('error', msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalTasksCount = stats?.total ?? tasks.length;

  return (
    <div className="app-layout">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        onOpenNewTaskModal={() => handleOpenCreateModal('todo')}
        onResetSampleData={handleResetSampleData}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="app-main-viewport">
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          onOpenNewTaskModal={() => handleOpenCreateModal('todo')}
          onRefresh={refreshAll}
          isRefreshing={isRefreshing}
          activeTab={activeTab}
        />

        {/* Dynamic Views */}
        <main className="main-content-scrollable">
          {/* Always show Dashboard Metrics on Board & Analytics tabs */}
          {activeTab !== 'viva' && (
            <StatsDashboard stats={stats} isLoading={isLoading} />
          )}

          {/* Kanban Board View */}
          {activeTab === 'board' && (
            <div className="board-view-container">
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                totalFiltered={tasks.length}
                totalTasks={totalTasksCount}
              />

              {isLoading ? (
                <div className="board-loading-container">
                  <div className="board-spinner" />
                  <p>Loading tasks from SQLite database...</p>
                </div>
              ) : (
                <KanbanBoard
                  tasks={tasks}
                  onEditTask={handleOpenEditModal}
                  onDeleteTask={handleOpenDeleteModal}
                  onStatusChange={handleStatusChange}
                  onQuickAddTask={(colStatus) => handleOpenCreateModal(colStatus)}
                  updatingTaskId={updatingTaskId}
                />
              )}
            </div>
          )}

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <div className="analytics-view-container">
              <div className="analytics-card-large">
                <h3 className="analytics-title">Task Distribution by Workflow Stage</h3>
                <div className="distribution-bars-container">
                  <div className="distribution-item">
                    <div className="distribution-info">
                      <span className="dist-label">To Do (Pending)</span>
                      <span className="dist-value">{stats?.pending || 0} tasks</span>
                    </div>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill fill-todo"
                        style={{
                          width: `${stats?.total ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="distribution-item">
                    <div className="distribution-info">
                      <span className="dist-label">In Progress</span>
                      <span className="dist-value">{stats?.in_progress || 0} tasks</span>
                    </div>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill fill-progress"
                        style={{
                          width: `${stats?.total ? ((stats.in_progress / stats.total) * 100).toFixed(1) : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="distribution-item">
                    <div className="distribution-info">
                      <span className="dist-label">Completed</span>
                      <span className="dist-value">{stats?.completed || 0} tasks</span>
                    </div>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill fill-done"
                        style={{
                          width: `${stats?.total ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Viva Evaluation and System Guide View */}
          {activeTab === 'viva' && <VivaInfoGuide />}
        </main>
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleSaveTask}
        taskToEdit={taskToEdit}
        defaultStatus={defaultColumnStatus}
      />

      {/* Task Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        task={taskToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default App;
