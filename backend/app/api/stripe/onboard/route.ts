import { NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { handleOptions, jsonResponse, errorResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerId, email } = body;

    if (!workerId) {
      return errorResponse('workerId is required', 400);
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return jsonResponse({
        success: true,
        accountId: `acct_mock_${workerId.replace('usr_', '')}`,
        mock: true,
        message: 'Stripe not configured — returning mock account',
      });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: email || undefined,
      metadata: { urgigs_worker_id: workerId },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/worker/profile?stripe_refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/worker/profile?stripe_success=true`,
      type: 'account_onboarding',
    });

    return jsonResponse({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      mock: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe onboard failed';
    console.error('[Stripe Onboard Error]', message);
    return errorResponse(message, 500);
  }
}
