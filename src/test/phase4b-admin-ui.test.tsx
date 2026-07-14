import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    logout: vi.fn(),
  }),
}));

// Default: mock mode (IS_STRIPE_LIVE = false)
vi.mock('../config/stripe', () => ({
  IS_STRIPE_LIVE: false,
  STRIPE_PUBLISHABLE_KEY: '',
  STRIPE_SECRET_KEY: '',
}));

describe('Phase 4B: Admin Dashboard - Stripe Status Banner (Mock Mode)', () => {
  it('shows amber banner with mock mode message when IS_STRIPE_LIVE is false', async () => {
    const { AdminDashboard } = await import('../screens/AdminDashboard');
    render(<AdminDashboard />);
    const banner = screen.getByTestId('stripe-status-banner');
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain('Stripe Credentials Missing - Running in Mock Mode');
  });
});
