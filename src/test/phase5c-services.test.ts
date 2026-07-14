import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('Phase 5C - Stripe Service (Backend Integration)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('onboardWorker calls backend /api/stripe/onboard', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        accountId: 'acct_live_123',
        onboardingUrl: 'https://connect.stripe.com/setup/xxx',
        mock: false,
      }),
    });

    const { onboardWorker } = await import('../services/stripe');
    const result = await onboardWorker('usr_wrk_001', 'test@test.com');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stripe/onboard'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result.success).toBe(true);
    expect(result.accountId).toBe('acct_live_123');
    expect(result.onboardingUrl).toBe('https://connect.stripe.com/setup/xxx');
  });

  it('onboardWorker handles error response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Stripe API error' }),
    });

    const { onboardWorker } = await import('../services/stripe');
    const result = await onboardWorker('usr_wrk_001');

    expect(result.success).toBe(false);
    expect(result.accountId).toBe('');
  });

  it('onboardWorker handles network failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { onboardWorker } = await import('../services/stripe');
    const result = await onboardWorker('usr_wrk_001');

    expect(result.success).toBe(false);
  });

  it('createPaymentIntent calls backend /api/stripe/payment-intent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        paymentIntentId: 'pi_live_123',
        clientSecret: 'pi_live_123_secret',
        mock: false,
      }),
    });

    const { createPaymentIntent } = await import('../services/stripe');
    const result = await createPaymentIntent(100, 'biz_001', 'shift_001');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stripe/payment-intent'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.success).toBe(true);
    expect(result.paymentIntentId).toBe('pi_live_123');
    expect(result.clientSecret).toBe('pi_live_123_secret');
  });

  it('saveCreditCard calls backend and saves locally', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        paymentIntentId: 'pi_setup_123',
        clientSecret: 'pi_setup_123_secret',
        mock: true,
      }),
    });

    const { saveCreditCard } = await import('../services/stripe');
    const result = await saveCreditCard('biz_001', {
      number: '4242424242424242',
      expiry: '12/27',
      cvc: '123',
    });

    expect(result.success).toBe(true);
    expect(result.last4).toBe('4242');
  });

  it('triggerTransfer calls backend /api/stripe/transfer', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        transferId: 'tr_live_123',
        mock: false,
      }),
    });

    const { triggerTransfer } = await import('../services/stripe');
    const result = await triggerTransfer(150, 'acct_live_worker', 'shift_001');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stripe/transfer'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.success).toBe(true);
    expect(result.transferId).toBe('tr_live_123');
  });

  it('checkStripeStatus calls health endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        stripe_configured: true,
        twilio_configured: false,
      }),
    });

    const { checkStripeStatus } = await import('../services/stripe');
    const result = await checkStripeStatus();

    expect(result.configured).toBe(true);
  });
});

describe('Phase 5C - Twilio Service (Backend Integration)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sendSMS calls backend /api/twilio/send', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        sid: 'SM123456',
        mock: false,
      }),
    });

    const { sendSMS } = await import('../services/twilio');
    const result = await sendSMS('+15551234567', 'Test message');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/twilio/send'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result.success).toBe(true);
    expect(result.sid).toBe('SM123456');
  });

  it('sendSMS handles error response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid phone number' }),
    });

    const { sendSMS } = await import('../services/twilio');
    const result = await sendSMS('+15551234567', 'Test');

    expect(result.success).toBe(false);
  });

  it('sendSMS handles network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'));

    const { sendSMS } = await import('../services/twilio');
    const result = await sendSMS('+15551234567', 'Test');

    expect(result.success).toBe(false);
  });

  it('checkTwilioStatus calls health endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        stripe_configured: true,
        twilio_configured: true,
      }),
    });

    const { checkTwilioStatus } = await import('../services/twilio');
    const result = await checkTwilioStatus();

    expect(result.configured).toBe(true);
  });
});
