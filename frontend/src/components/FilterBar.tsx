import React from 'react';
import { Search, X, Filter, ArrowUpDown, RotateCcw } from 'lucide-react';
import { FilterState, TaskPriority, TaskSortOption, TaskStatus } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalTasks: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
  totalTasks,
}) => {
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.sort !== 'created_at_desc';

  return (
    <div className="filter-bar-container">
      <div className="filter-bar-inputs">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={17} />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by title or description..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            aria-label="Search tasks"
          />
          {filters.search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onFilterChange({ search: '' })}
              aria-label="Clear search text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="filter-select-group">
          <Filter size={15} className="select-icon" />
          <select
            className="filter-select"
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value as TaskPriority | 'all' })}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-select-group">
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as TaskStatus | 'all' })}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="filter-select-group">
          <ArrowUpDown size={15} className="select-icon" />
          <select
            className="filter-select"
            value={filters.sort}
            onChange={(e) => onFilterChange({ sort: e.target.value as TaskSortOption })}
            aria-label="Sort tasks"
          >
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="due_date_asc">Due Date (Earliest)</option>
            <option value="due_date_desc">Due Date (Latest)</option>
            <option value="priority_desc">Priority (High to Low)</option>
            <option value="priority_asc">Priority (Low to High)</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={onResetFilters}
            title="Reset all filters and sorting to defaults"
          >
            <RotateCcw size={14} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Filter results counter */}
      <div className="filter-results-info">
        <span>
          Showing <strong>{totalFiltered}</strong> of <strong>{totalTasks}</strong> tasks
          {hasActiveFilters && ' (filtered)'}
        </span>
      </div>
    </div>
  );
};
