// Twilio SMS Service — Phase 5C: Calls backend API routes
// No secrets on the frontend; all SMS logic goes through the backend.
// In demo mode (no VITE_API_BASE_URL), SMS messages are logged to the console instead.
import { API_BASE_URL, IS_BACKEND_CONFIGURED } from '../config/api';
import { useNotificationBanner } from '../store/notificationBanner';

// True when SMS requests go to the real backend. Whether the backend actually has
// Twilio credentials is reported by checkTwilioStatus().
export const IS_TWILIO_LIVE = IS_BACKEND_CONFIGURED;

export interface SMSResult {
  success: boolean;
  sid?: string;
  mock?: boolean;
}

function sendDemoSMS(to: string, message: string): SMSResult {
  console.log(`[Twilio SMS Sent to ${to}]: ${message}`);
  return {
    success: true,
    sid: `mock_sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mock: true,
  };
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  if (!IS_TWILIO_LIVE) return sendDemoSMS(to, message);

  // Nothing to send to; the backend would reject this with a 400.
  if (!to) return { success: false };

  try {
    const response = await fetch(`${API_BASE_URL}/api/twilio/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: data.success, sid: data.sid, mock: data.mock };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'SMS send failed';
    console.error('[Twilio Service]', errMsg);
    useNotificationBanner.getState().showBanner('error', `SMS: ${errMsg}`);
    return { success: false };
  }
}

// Check if backend Twilio is configured
export async function checkTwilioStatus(): Promise<{ configured: boolean }> {
  if (!IS_BACKEND_CONFIGURED) return { configured: false };
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return { configured: false };
    const data = await response.json();
    return { configured: data.twilio_configured };
  } catch {
    return { configured: false };
  }
}
