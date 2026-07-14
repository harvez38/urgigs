// Twilio SMS Service — Phase 5B
// Supports mock mode (logs to console) when env vars are not configured

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

function isMockMode(): boolean {
  return (
    !TWILIO_ACCOUNT_SID ||
    TWILIO_ACCOUNT_SID.startsWith('your_') ||
    !TWILIO_AUTH_TOKEN ||
    TWILIO_AUTH_TOKEN.startsWith('your_') ||
    !TWILIO_PHONE_NUMBER ||
    TWILIO_PHONE_NUMBER.startsWith('your_')
  );
}

export const IS_TWILIO_LIVE: boolean = !isMockMode();

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string }> {
  if (isMockMode()) {
    console.log(`[Twilio SMS Sent to ${to}]: ${message}`);
    return { success: true, sid: `mock_sms_${Date.now()}` };
  }

  // Real Twilio API call via REST
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const body = new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      console.error('[Twilio] SMS send failed:', response.status);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('[Twilio] SMS send error:', error);
    return { success: false };
  }
}
