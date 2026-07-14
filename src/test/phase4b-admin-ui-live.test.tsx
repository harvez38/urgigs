import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    logout: vi.fn(),
  }),
}));

// Live mode: IS_STRIPE_LIVE = true
vi.mock('../config/stripe', () => ({
  IS_STRIPE_LIVE: true,
  STRIPE_PUBLISHABLE_KEY: 'pk_test_real123',
  STRIPE_SECRET_KEY: 'sk_test_real123',
}));

describe('Phase 4B: Admin Dashboard - Stripe Status Banner (Live Mode)', () => {
  it('shows green banner with connected message when IS_STRIPE_LIVE is true', async () => {
    const { AdminDashboard } = await import('../screens/AdminDashboard');
    render(<AdminDashboard />);
    const banner = screen.getByTestId('stripe-status-banner');
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain('Stripe Live/Test Environment Connected');
  });
});
