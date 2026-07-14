import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { EmployerHub } from '../screens/EmployerHub';
import { PostShiftModal } from '../components/PostShiftModal';
import { ShiftCard } from '../components/ShiftCard';
import { Shift } from '../types';

function loginAsEmployer() {
  useAuthStore.getState().login('employer@urgigs.com', 'test');
}

describe('Shift-Creation Flow Updates', () => {
  describe('EmployerHub - Updated Labels', () => {
    it('should show "+ Post a New Shift" button', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );
      expect(screen.getByText('+ Post a New Shift')).toBeDefined();
    });

    it('should show "Active" toggle tab', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );
      expect(screen.getByText(/Active \(/)).toBeDefined();
    });

    it('should not contain old "Active Gigs" label', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );
      expect(screen.queryByText(/Active Gigs/)).toBeNull();
    });

    it('should not contain old "+ Post Shift" label (without "a New")', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );
      // The exact old text should not be present
      expect(screen.queryByText('+ Post Shift')).toBeNull();
    });
  });

  describe('PostShiftModal - Updated Labels', () => {
    it('should have modal title "Post a New Shift"', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      expect(screen.getByText('Post a New Shift')).toBeDefined();
    });

    it('should have submit button labeled "Publish Shift"', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      expect(screen.getByText('Publish Shift')).toBeDefined();
    });

    it('should have "Detailed Description" label', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      expect(screen.getByText('Detailed Description *')).toBeDefined();
    });

    it('should have all required form fields', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      expect(screen.getByText('Role Title *')).toBeDefined();
      expect(screen.getByText('Detailed Description *')).toBeDefined();
      expect(screen.getByText('Hourly Rate ($) *')).toBeDefined();
      expect(screen.getByText('Start Time *')).toBeDefined();
      expect(screen.getByText('End Time *')).toBeDefined();
    });

    it('should validate pay rate > 0 on empty submit', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      // Submit without filling anything - hourly_rate is '' which fails validation
      const submitBtn = screen.getByText('Publish Shift');
      fireEvent.click(submitBtn);
      expect(screen.getByText('Valid rate required')).toBeDefined();
    });

    it('should validate end time > start time', () => {
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
      );
      const roleInput = screen.getByPlaceholderText('e.g., Bartender, Event Setup');
      const descInput = screen.getByPlaceholderText('Describe what the worker will be doing...');
      const rateInput = screen.getByPlaceholderText('25');

      fireEvent.change(roleInput, { target: { value: 'Bartender' } });
      fireEvent.change(descInput, { target: { value: 'Mix drinks' } });
      fireEvent.change(rateInput, { target: { value: '25' } });

      const timeInputs = document.querySelectorAll('input[type="datetime-local"]');
      fireEvent.change(timeInputs[0], { target: { value: '2026-07-15T18:00' } });
      fireEvent.change(timeInputs[1], { target: { value: '2026-07-15T16:00' } }); // End before start

      const submitBtn = screen.getByText('Publish Shift');
      fireEvent.click(submitBtn);
      expect(screen.getByText('End must be after start')).toBeDefined();
    });

    it('should call onSubmit when form is valid', () => {
      const onSubmit = vi.fn();
      render(
        <PostShiftModal isOpen={true} onClose={() => {}} onSubmit={onSubmit} />
      );

      const roleInput = screen.getByPlaceholderText('e.g., Bartender, Event Setup');
      const descInput = screen.getByPlaceholderText('Describe what the worker will be doing...');
      const rateInput = screen.getByPlaceholderText('25');

      fireEvent.change(roleInput, { target: { value: 'Bartender' } });
      fireEvent.change(descInput, { target: { value: 'Mix drinks at event' } });
      fireEvent.change(rateInput, { target: { value: '30' } });

      const timeInputs = document.querySelectorAll('input[type="datetime-local"]');
      fireEvent.change(timeInputs[0], { target: { value: '2026-07-15T18:00' } });
      fireEvent.change(timeInputs[1], { target: { value: '2026-07-15T23:00' } });

      const submitBtn = screen.getByText('Publish Shift');
      fireEvent.click(submitBtn);
      expect(onSubmit).toHaveBeenCalledWith({
        role_title: 'Bartender',
        description: 'Mix drinks at event',
        hourly_rate: '30',
        start_time: '2026-07-15T18:00',
        end_time: '2026-07-15T23:00',
      });
    });
  });

  describe('ShiftCard - Status Badges', () => {
    const baseShift: Shift = {
      id: 'test-shift-1',
      business_id: 'biz-1',
      posted_by: 'user-1',
      worker_id: null,
      title: 'Test Shift',
      description: 'Test description',
      category: 'General',
      hourly_rate: 25,
      start_time: '2026-07-15T18:00:00.000Z',
      end_time: '2026-07-15T23:00:00.000Z',
      location: '123 Main St',
      city: 'Miami',
      state: 'FL',
      slots_total: 1,
      slots_filled: 0,
      status: 'open',
      requirements: [],
      created_at: '2026-07-14T12:00:00.000Z',
      updated_at: '2026-07-14T12:00:00.000Z',
    };

    it('should display "OPEN" badge in uppercase for open status', () => {
      render(<ShiftCard shift={baseShift} variant="employer" />);
      expect(screen.getByText('OPEN')).toBeDefined();
    });

    it('should display "ASSIGNED" badge in uppercase for assigned status', () => {
      const assignedShift = { ...baseShift, status: 'assigned' as const, worker_id: 'worker-1' };
      render(<ShiftCard shift={assignedShift} variant="employer" />);
      expect(screen.getByText('ASSIGNED')).toBeDefined();
    });

    it('should display "IN PROGRESS" badge in uppercase for in_progress status', () => {
      const inProgressShift = { ...baseShift, status: 'in_progress' as const, worker_id: 'worker-1' };
      render(<ShiftCard shift={inProgressShift} variant="employer" />);
      expect(screen.getByText('IN PROGRESS')).toBeDefined();
    });

    it('should display "COMPLETED / PENDING PAYOUT" badge for completed status', () => {
      const completedShift = { ...baseShift, status: 'completed' as const, worker_id: 'worker-1' };
      render(<ShiftCard shift={completedShift} variant="employer" />);
      expect(screen.getByText('COMPLETED / PENDING PAYOUT')).toBeDefined();
    });

    it('should display "CANCELLED" badge in uppercase', () => {
      const cancelledShift = { ...baseShift, status: 'cancelled' as const };
      render(<ShiftCard shift={cancelledShift} variant="employer" />);
      expect(screen.getByText('CANCELLED')).toBeDefined();
    });
  });

  describe('Full Shift Creation Flow', () => {
    it('should open modal when "+ Post a New Shift" is clicked', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );
      const postButton = screen.getByText('+ Post a New Shift');
      fireEvent.click(postButton);
      expect(screen.getByText('Post a New Shift')).toBeDefined();
      expect(screen.getByText('Publish Shift')).toBeDefined();
    });

    it('should create a shift and display it with OPEN badge in Active tab', () => {
      loginAsEmployer();
      render(
        <MemoryRouter>
          <EmployerHub />
        </MemoryRouter>
      );

      // Open the modal
      const postButton = screen.getByText('+ Post a New Shift');
      fireEvent.click(postButton);

      // Fill the form
      const roleInput = screen.getByPlaceholderText('e.g., Bartender, Event Setup');
      const descInput = screen.getByPlaceholderText('Describe what the worker will be doing...');
      const rateInput = screen.getByPlaceholderText('25');

      fireEvent.change(roleInput, { target: { value: 'Event DJ' } });
      fireEvent.change(descInput, { target: { value: 'Play music at corporate event' } });
      fireEvent.change(rateInput, { target: { value: '50' } });

      const timeInputs = document.querySelectorAll('input[type="datetime-local"]');
      fireEvent.change(timeInputs[0], { target: { value: '2026-07-20T20:00' } });
      fireEvent.change(timeInputs[1], { target: { value: '2026-07-21T02:00' } });

      // Submit
      const submitBtn = screen.getByText('Publish Shift');
      fireEvent.click(submitBtn);

      // Verify the shift appears in active postings with OPEN badge
      expect(screen.getByText('Event DJ')).toBeDefined();
      // Multiple OPEN badges may exist (from seeded data + new shift)
      const openBadges = screen.getAllByText('OPEN');
      expect(openBadges.length).toBeGreaterThan(0);
      expect(screen.getByText(/Active \(/)).toBeDefined();
    });
  });
});
