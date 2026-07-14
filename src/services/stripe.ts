// Stripe Connect Service — Swap STRIPE_SECRET_KEY for production key
const STRIPE_SECRET_KEY = 'sk_test_REPLACE_WITH_REAL_KEY';

import { db } from '../store/database';

export interface StripeOnboardResult { success: boolean; accountId: string; }
export interface StripeCardResult { success: boolean; token: string; last4: string; }

export interface CardData {
  number: string;
  expiry: string;
  cvc: string;
}

// Simulates Stripe Express Connect onboarding for a worker
export async function onboardWorker(workerId: string): Promise<StripeOnboardResult> {
  await new Promise(r => setTimeout(r, 1200)); // simulate API delay
  db.updateWorkerStripeStatus(workerId, true);
  return { success: true, accountId: `acct_mock_${workerId.replace('usr_', '')}` };
}

// Simulates saving a card via Stripe.js tokenization
export async function saveCreditCard(businessId: string, cardData: CardData): Promise<StripeCardResult> {
  await new Promise(r => setTimeout(r, 1000));
  const token = 'tok_mock_123';
  const last4 = cardData.number.slice(-4);
  db.saveBusinessPaymentMethod(businessId, token, last4);
  return { success: true, token, last4 };
}
