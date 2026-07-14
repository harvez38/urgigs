import { NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { handleOptions, jsonResponse, errorResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, businessId, shiftId, metadata } = body;

    if (!amount || amount <= 0) {
      return errorResponse('Valid amount is required', 400);
    }

    const stripe = getStripeClient();
    if (!stripe) {
      const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return jsonResponse({
        success: true,
        paymentIntentId: mockId,
        clientSecret: `${mockId}_secret_mock`,
        mock: true,
        message: 'Stripe not configured — returning mock PaymentIntent',
      });
    }

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency || 'usd',
      metadata: {
        urgigs_business_id: businessId || '',
        urgigs_shift_id: shiftId || '',
        ...metadata,
      },
      automatic_payment_methods: { enabled: true },
    });

    return jsonResponse({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      mock: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'PaymentIntent creation failed';
    console.error('[Stripe PaymentIntent Error]', message);
    return errorResponse(message, 500);
  }
}
