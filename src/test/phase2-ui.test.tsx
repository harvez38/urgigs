import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { WorkerFindGigs } from '../screens/WorkerFindGigs';
import { EmployerHub } from '../screens/EmployerHub';
import { WorkerEarnings } from '../screens/WorkerEarnings';
import { PostShiftModal } from '../components/PostShiftModal';

function loginAsWorker() {
  useAuthStore.getState().login('worker@urgigs.com', 'test');
}

function loginAsEmployer() {
  useAuthStore.getState().login('employer@urgigs.com', 'test');
}

describe('Phase 2 UI Components', () => {
  describe('Worker - Claim Button', () => {
    it('should render Claim Shift button on open shift cards', () => {
      loginAsWorker();
      render(
        <MemoryRouter>
          <WorkerFindGigs />
        </MemoryRouter>
      );
      const claimButtons = screen.getAllByText('Claim Shift');
      expect(claimButtons.length).toBeGreaterThan(0);
    });

    it('should show claimed state after clicking claim', () => {
      loginAsWorker();
      render(
        <MemoryRouter>
          <WorkerFindGigs />
        </MemoryRouter>
      );
      const claimButton = screen.getAllByText('Claim Shift')[0];
      fireEvent.click(claimButton);
      expect(screen.getByText('✓ Claimed')).toBeDefined();
    });
  });

  describe('Employer Hub - Active/Past/Manage Toggle', () => {
    it('should render Active, Past, and Manage Shifts tabs', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );
      expect(screen.getByText(/Active \(/)).toBeDefined();
      expect(screen.getByText(/Past \(/)).toBeDefined();
      expect(screen.getByText(/Manage Shifts \(/)).toBeDefined();
    });

    it('should show Post a New Shift button', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );
      expect(screen.getByText('+ Post a New Shift')).toBeDefined();
    });
  });

  describe('Wallet & Earnings', () => {
    it('should display total lifetime earnings', () => {
      loginAsWorker();
      render(
        <MemoryRouter>
          <WorkerEarnings />
        </MemoryRouter>
      );
      expect(screen.getByText('Wallet & Earnings')).toBeDefined();
      expect(screen.getByText('Total Lifetime Earnings')).toBeDefined();
    });

    it('should show earnings ledger with paid and completed shifts', () => {
      loginAsWorker();
      render(
        <MemoryRouter>
          <WorkerEarnings />
        </MemoryRouter>
      );
      expect(screen.getByText('Earnings Ledger')).toBeDefined();
      const paidBadges = screen.getAllByText('PAID');
      expect(paidBadges.length).toBeGreaterThan(0);
    });

    it('should show pending payout badge for completed shifts', () => {
      loginAsWorker();
      render(
        <MemoryRouter>
          <WorkerEarnings />
        </MemoryRouter>
      );
      expect(screen.getByText('COMPLETED / PENDING PAYOUT')).toBeDefined();
    });

    it('should show pending payouts section', () => {
      loginAsWorker();
      render(
        <MemoryRouter>
          <WorkerEarnings />
        </MemoryRouter>
      );
      expect(screen.getByText('Pending Payouts')).toBeDefined();
    });
  });

  describe('Post Shift Modal', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <PostShiftModal isOpen={false} onClose={() => {}} onSubmit={() => {}} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('should render form fields when open', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      expect(screen.getByText('Post a New Shift')).toBeDefined();
      expect(screen.getByPlaceholderText('e.g., Bartender, Event Setup')).toBeDefined();
      expect(screen.getByPlaceholderText('Describe what the worker will be doing...')).toBeDefined();
    });

    it('should show validation errors on empty submit', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      const submitBtn = screen.getByText('Publish Shift');
      fireEvent.click(submitBtn);
      expect(screen.getByText('Role title is required')).toBeDefined();
      expect(screen.getByText('Description is required')).toBeDefined();
    });
  });
});
