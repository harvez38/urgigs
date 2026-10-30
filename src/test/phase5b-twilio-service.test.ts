import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendSMS } from '../services/twilio';

// The frontend service always goes through the backend. When Twilio isn't
// configured server-side, the backend answers with a mock SID.
describe('Twilio Service - Backend Mock Mode', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sendSMS returns success and the mock SID from the backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, sid: 'mock_sms_123', mock: true }),
    });
    const result = await sendSMS('+15550202', 'Hello test');
    expect(result.success).toBe(true);
    expect(result.mock).toBe(true);
    expect(result.sid).toMatch(/^mock_sms_/);
  });

  it('sendSMS posts the recipient and message as JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, sid: 'mock_sms_123', mock: true }),
    });
    await sendSMS('+15550202', 'Test alert message');
    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ to: '+15550202', message: 'Test alert message' });
  });

  it('sendSMS reports failure when the backend rejects an empty phone number', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Both "to" and "message" are required' }),
    });
    const result = await sendSMS('', 'No phone');
    expect(result.success).toBe(false);
  });
});
