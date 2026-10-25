import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsDashboard } from '../components/StatsDashboard';
import { TaskStats } from '../types';

describe('StatsDashboard Component', () => {
  const mockStats: TaskStats = {
    total: 10,
    completed: 4,
    in_progress: 3,
    pending: 3,
    completion_rate: 40,
    by_priority: {
      high: 3,
      medium: 5,
      low: 2,
    },
    overdue: 1,
  };

  it('renders all four statistical metric cards with accurate values', () => {
    render(<StatsDashboard stats={mockStats} isLoading={false} />);

    // Check headings
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('To Do (Pending)')).toBeInTheDocument();

    // Check values
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2);
  });

  it('displays completion percentage and progress bar', () => {
    render(<StatsDashboard stats={mockStats} isLoading={false} />);

    expect(screen.getByText('40% finished')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '40');
  });

  it('renders priority distribution and overdue warning badge', () => {
    render(<StatsDashboard stats={mockStats} isLoading={false} />);

    expect(screen.getByTitle('High Priority Tasks')).toHaveTextContent('High: 3');
    expect(screen.getByTitle('Medium Priority Tasks')).toHaveTextContent('Med: 5');
    expect(screen.getByTitle('Low Priority Tasks')).toHaveTextContent('Low: 2');
    expect(screen.getByTitle('Overdue Tasks')).toHaveTextContent('Overdue: 1');
  });

  it('renders skeleton loading placeholders when isLoading is true and stats is null', () => {
    const { container } = render(<StatsDashboard stats={null} isLoading={true} />);

    const skeletonWrapper = screen.getByLabelText('Loading stats');
    expect(skeletonWrapper).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton-card').length).toBe(4);
  });
});
