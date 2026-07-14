import { NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { handleOptions, jsonResponse, errorResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, destinationAccountId, shiftId } = body;

    if (!amount || amount <= 0) {
      return errorResponse('Valid amount is required', 400);
    }

    if (!destinationAccountId) {
      return errorResponse('destinationAccountId is required', 400);
    }

    const stripe = getStripeClient();
    if (!stripe) {
      const mockId = `tr_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return jsonResponse({
        success: true,
        transferId: mockId,
        mock: true,
        message: 'Stripe not configured \u2014 returning mock transfer',
      });
    }

    const amountInCents = Math.round(amount * 100);

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: destinationAccountId,
      metadata: {
        urgigs_shift_id: shiftId || '',
      },
    });

    return jsonResponse({
      success: true,
      transferId: transfer.id,
      mock: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Transfer creation failed';
    console.error('[Stripe Transfer Error]', message);
    return errorResponse(message, 500);
  }
}
