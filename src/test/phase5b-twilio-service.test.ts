import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the twilio service module directly (without mocking it)
// Since env vars aren't set in test, it will be in mock mode

describe('Twilio Service - Mock Mode', () => {
  let sendSMS: typeof import('../services/twilio').sendSMS;
  let IS_TWILIO_LIVE: boolean;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../services/twilio');
    sendSMS = mod.sendSMS;
    IS_TWILIO_LIVE = mod.IS_TWILIO_LIVE;
  });

  it('IS_TWILIO_LIVE is false when env vars are placeholder values', () => {
    // In test environment, VITE_TWILIO_ACCOUNT_SID is either undefined or starts with "your_"
    expect(IS_TWILIO_LIVE).toBe(false);
  });

  it('sendSMS returns success in mock mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await sendSMS('+15550202', 'Hello test');
    expect(result.success).toBe(true);
    expect(result.sid).toMatch(/^mock_sms_/);
    consoleSpy.mockRestore();
  });

  it('sendSMS logs the correct format in mock mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await sendSMS('+15550202', 'Test alert message');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Twilio SMS Sent to +15550202]: Test alert message'
    );
    consoleSpy.mockRestore();
  });

  it('sendSMS handles empty phone number gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await sendSMS('', 'No phone');
    expect(result.success).toBe(true);
    consoleSpy.mockRestore();
  });
});
