import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../components/FilterBar';
import { FilterState } from '../types';

describe('FilterBar Component', () => {
  const defaultFilters: FilterState = {
    search: '',
    status: 'all',
    priority: 'all',
    sort: 'created_at_desc',
  };

  it('renders all filter controls and summary count', () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={vi.fn()}
        onResetFilters={vi.fn()}
        totalFiltered={6}
        totalTasks={6}
      />
    );

    expect(screen.getByPlaceholderText('Search by title or description...')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort tasks')).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 6 of 6 tasks');
  });

  it('triggers onFilterChange when typing in search input', () => {
    const handleFilterChange = vi.fn();
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
        totalFiltered={6}
        totalTasks={6}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by title or description...');
    fireEvent.change(searchInput, { target: { value: 'Database' } });

    expect(handleFilterChange).toHaveBeenCalledWith({ search: 'Database' });
  });

  it('triggers onFilterChange when selecting priority', () => {
    const handleFilterChange = vi.fn();
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
        totalFiltered={6}
        totalTasks={6}
      />
    );

    const prioritySelect = screen.getByLabelText('Filter by priority');
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    expect(handleFilterChange).toHaveBeenCalledWith({ priority: 'high' });
  });

  it('triggers onFilterChange when selecting status', () => {
    const handleFilterChange = vi.fn();
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
        totalFiltered={6}
        totalTasks={6}
      />
    );

    const statusSelect = screen.getByLabelText('Filter by status');
    fireEvent.change(statusSelect, { target: { value: 'done' } });

    expect(handleFilterChange).toHaveBeenCalledWith({ status: 'done' });
  });

  it('triggers onFilterChange when selecting sort order', () => {
    const handleFilterChange = vi.fn();
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
        totalFiltered={6}
        totalTasks={6}
      />
    );

    const sortSelect = screen.getByLabelText('Sort tasks');
    fireEvent.change(sortSelect, { target: { value: 'due_date_asc' } });

    expect(handleFilterChange).toHaveBeenCalledWith({ sort: 'due_date_asc' });
  });

  it('shows Clear Filters button when filters are active and calls onResetFilters on click', () => {
    const activeFilters: FilterState = {
      search: 'Test',
      status: 'in_progress',
      priority: 'high',
      sort: 'due_date_asc',
    };

    const handleReset = vi.fn();

    render(
      <FilterBar
        filters={activeFilters}
        onFilterChange={vi.fn()}
        onResetFilters={handleReset}
        totalFiltered={2}
        totalTasks={6}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /Clear Filters/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('does not display Clear Filters button when default filters are active', () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={vi.fn()}
        onResetFilters={vi.fn()}
        totalFiltered={6}
        totalTasks={6}
      />
    );

    expect(screen.queryByRole('button', { name: /Clear Filters/i })).not.toBeInTheDocument();
  });
});
