// Twilio SMS Service — Phase 5C: Calls backend API routes
// No secrets on the frontend; all SMS logic goes through the backend
import { API_BASE_URL } from '../config/api';
import { useNotificationBanner } from '../store/notificationBanner';

export const IS_TWILIO_LIVE = true; // determined by backend config

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; mock?: boolean }> {
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
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return { configured: false };
    const data = await response.json();
    return { configured: data.twilio_configured };
  } catch {
    return { configured: false };
  }
}
