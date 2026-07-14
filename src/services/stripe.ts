// Stripe Connect Service — Uses config for key management
import { STRIPE_SECRET_KEY, IS_STRIPE_LIVE } from '../config/stripe';
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
  const prefix = IS_STRIPE_LIVE ? 'acct_live_' : 'acct_mock_';
  return { success: true, accountId: `${prefix}${workerId.replace('usr_', '')}` };
}

// Simulates saving a card via Stripe.js tokenization
export async function saveCreditCard(businessId: string, cardData: CardData): Promise<StripeCardResult> {
  await new Promise(r => setTimeout(r, 1000));
  const token = IS_STRIPE_LIVE ? `tok_live_${Date.now()}` : 'tok_mock_123';
  const last4 = cardData.number.slice(-4);
  db.saveBusinessPaymentMethod(businessId, token, last4);
  return { success: true, token, last4 };
}

// Re-export for use in other modules
export { IS_STRIPE_LIVE, STRIPE_SECRET_KEY };
