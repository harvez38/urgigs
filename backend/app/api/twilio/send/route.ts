import { NextRequest } from 'next/server';
import { getTwilioClient, getTwilioPhoneNumber } from '@/lib/twilio';
import { handleOptions, jsonResponse, errorResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return errorResponse('Both "to" and "message" are required', 400);
    }

    const client = getTwilioClient();
    const fromNumber = getTwilioPhoneNumber();

    if (!client || !fromNumber) {
      console.log(`[Twilio Mock] SMS to ${to}: ${message}`);
      return jsonResponse({
        success: true,
        sid: `mock_sms_${Date.now()}`,
        mock: true,
        message: 'Twilio not configured — SMS logged to console',
      });
    }

    const result = await client.messages.create({
      to,
      from: fromNumber,
      body: message,
    });

    return jsonResponse({
      success: true,
      sid: result.sid,
      mock: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SMS send failed';
    console.error('[Twilio Send Error]', message);
    return errorResponse(message, 500);
  }
}
