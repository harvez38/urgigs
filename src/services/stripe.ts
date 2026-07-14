import { db } from '../store/database';

export interface CardData {
  number: string;
  expiry: string;
  cvc: string;
}

export interface OnboardingResult {
  success: boolean;
  accountId: string;
}

export interface SaveCardResult {
  success: boolean;
  token: string;
}

export async function onboardWorker(workerId: string): Promise<OnboardingResult> {
  // Simulate Stripe Express onboarding delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  db.updateWorkerStripeStatus(workerId, true);
  return {
    success: true,
    accountId: `acct_mock_${workerId.replace('usr_', '')}`,
  };
}

export async function saveCreditCard(businessId: string, _cardData: CardData): Promise<SaveCardResult> {
  // Simulate Stripe card tokenization delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  const token = 'tok_mock_123';
  db.updateBusinessPaymentMethod(businessId, token);
  return {
    success: true,
    token,
  };
}
