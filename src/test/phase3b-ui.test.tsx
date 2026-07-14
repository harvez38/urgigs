import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { AdminDashboard } from '../screens/AdminDashboard';

describe('Phase 3B: Admin Dashboard UI', () => {
  beforeEach(() => {
    db.reset();
    useAuthStore.setState({
      currentUser: db.findUserByEmail('admin@urgigs.com')!,
      isAuthenticated: true,
      businessProfile: null,
      workerProfile: null,
    });
  });

  it('should render the admin dashboard with stats', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('UrGigs Admin')).toBeInTheDocument();
    expect(screen.getByText('Platform Volume')).toBeInTheDocument();
    expect(screen.getByText('Platform Fees (10%)')).toBeInTheDocument();
    expect(screen.getByText('Total Shifts')).toBeInTheDocument();
    expect(screen.getByText('Active Disputes')).toBeInTheDocument();
  });

  it('should show user list by default with search', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    expect(screen.getByText('Sarah Martinez')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users by name, email, or role...')).toBeInTheDocument();
  });

  it('should filter users by search query', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search users by name, email, or role...');
    fireEvent.change(searchInput, { target: { value: 'Marcus' } });

    expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    expect(screen.queryByText('Sarah Martinez')).not.toBeInTheDocument();
  });

  it('should verify a worker when clicking Verify button', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('⏳ Unverified')).toBeInTheDocument();

    const verifyBtn = screen.getByText('Verify');
    fireEvent.click(verifyBtn);

    expect(screen.queryByText('⏳ Unverified')).not.toBeInTheDocument();
    expect(screen.getAllByText('✓ Verified').length).toBeGreaterThan(0);
  });

  it('should switch to transactions tab and show ledger', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    const transTab = screen.getByText('Transactions (3)');
    fireEvent.click(transTab);

    expect(screen.getByText('Total Volume')).toBeInTheDocument();
    expect(screen.getByText('Platform Revenue (10%)')).toBeInTheDocument();
  });

  it('should switch to disputes tab and show empty state when no disputes', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    const disputeTab = screen.getByText('Disputes (0)');
    fireEvent.click(disputeTab);

    expect(screen.getByText('No Active Disputes')).toBeInTheDocument();
  });

  it('should show disputed shifts and resolve buttons', () => {
    db.disputeShift('shift_003');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    const disputeTab = screen.getByText('Disputes (1)');
    fireEvent.click(disputeTab);

    expect(screen.getByText('Catering Server - Wedding')).toBeInTheDocument();
    expect(screen.getByText('✓ Approve Worker Payout')).toBeInTheDocument();
    expect(screen.getByText('↩ Refund Employer')).toBeInTheDocument();
  });

  it('should resolve a dispute by approving worker payout', () => {
    db.disputeShift('shift_003');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    const disputeTab = screen.getByText('Disputes (1)');
    fireEvent.click(disputeTab);

    const approveBtn = screen.getByText('✓ Approve Worker Payout');
    fireEvent.click(approveBtn);

    expect(screen.getByText('No Active Disputes')).toBeInTheDocument();

    const shift = db.getShiftById('shift_003');
    expect(shift?.status).toBe('completed');
  });

  it('should resolve a dispute by refunding employer', () => {
    db.disputeShift('shift_006');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    const disputeTab = screen.getByText('Disputes (1)');
    fireEvent.click(disputeTab);

    const refundBtn = screen.getByText('↩ Refund Employer');
    fireEvent.click(refundBtn);

    const shift = db.getShiftById('shift_006');
    expect(shift?.status).toBe('cancelled');
  });
});
