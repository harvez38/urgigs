import { jsonResponse } from '@/lib/cors';

export async function GET() {
  return jsonResponse({
    status: 'ok',
    stripe_configured: !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('your_'),
    twilio_configured: !!process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.startsWith('your_'),
  });
}
