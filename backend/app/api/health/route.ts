import { jsonResponse } from '@/lib/cors';

// Read env vars per request; otherwise Next prerenders this at build time
export const dynamic = 'force-dynamic';

export async function GET() {
  return jsonResponse({
    status: 'ok',
    stripe_configured: !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('your_'),
    twilio_configured: !!process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.startsWith('your_'),
  });
}
