import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import MetricCard from '../components/common/MetricCard';
import EmptyState from '../components/common/EmptyState';
import { FolderGit2 } from 'lucide-react';
import Login from '../pages/auth/Login';
import { AuthProvider } from '../context/AuthContext';

describe('Common UI Components', () => {
  it('renders StatusBadge with correct class and text', () => {
    const { container } = render(<StatusBadge status="Active" />);
    expect(container.textContent).toContain('Active');
    expect(container.querySelector('.badge')).toBeTruthy();
  });

  it('renders StatusBadge for Guide Approved status', () => {
    const { container } = render(<StatusBadge status="Guide Approved" />);
    expect(container.textContent).toContain('Guide Approved');
  });

  it('renders ProgressBar with percentage style', () => {
    const { container } = render(<ProgressBar value={75} height={10} />);
    const bar = container.querySelector('.progress-bar');
    expect(bar).toBeTruthy();
    expect(bar.style.width).toBe('75%');
  });

  it('renders MetricCard with title, value, and icon', () => {
    render(
      <MetricCard
        title="Active Projects"
        value={12}
        icon={FolderGit2}
        color="primary"
      />
    );
    expect(screen.getByText('Active Projects')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('renders EmptyState with title and description', () => {
    render(
      <EmptyState
        title="No Projects Found"
        description="Try adjusting your filter settings."
      />
    );
    expect(screen.getByText('No Projects Found')).toBeTruthy();
    expect(screen.getByText('Try adjusting your filter settings.')).toBeTruthy();
  });
});

describe('Authentication Pages', () => {
  it('renders Login page with ProjAxis branding and form inputs', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getAllByText(/ProjAxis/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Email Address/i)).toBeTruthy();
    expect(screen.getByLabelText(/Password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeTruthy();
  });
});
