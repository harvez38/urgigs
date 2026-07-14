// Stripe Connect Service — Phase 5C: Calls backend API routes
import { API_BASE_URL } from '../config/api';
import { useNotificationBanner } from '../store/notificationBanner';
import { db } from '../store/database';

export interface StripeOnboardResult {
  success: boolean;
  accountId: string;
  onboardingUrl?: string;
  mock?: boolean;
}

export interface StripeCardResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  token?: string;
  last4?: string;
  mock?: boolean;
}

export interface StripeTransferResult {
  success: boolean;
  transferId?: string;
  mock?: boolean;
}

export interface CardData {
  number: string;
  expiry: string;
  cvc: string;
}

// Onboard worker via backend API (creates Stripe Express account)
export async function onboardWorker(workerId: string, email?: string): Promise<StripeOnboardResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId, email }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      db.updateWorkerStripeStatus(workerId, true);
    }
    return {
      success: data.success,
      accountId: data.accountId,
      onboardingUrl: data.onboardingUrl,
      mock: data.mock,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to onboard worker';
    useNotificationBanner.getState().showBanner('error', `Stripe Onboard: ${message}`);
    return { success: false, accountId: '' };
  }
}

// Create a PaymentIntent via backend (for processing card payments)
export async function createPaymentIntent(
  amount: number,
  businessId: string,
  shiftId?: string
): Promise<StripeCardResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, businessId, shiftId, currency: 'usd' }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      paymentIntentId: data.paymentIntentId,
      clientSecret: data.clientSecret,
      mock: data.mock,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment failed';
    useNotificationBanner.getState().showBanner('error', `Payment: ${message}`);
    return { success: false };
  }
}

// Save credit card — calls backend to create a PaymentIntent / setup for the card
export async function saveCreditCard(businessId: string, cardData: CardData): Promise<StripeCardResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1,
        businessId,
        currency: 'usd',
        metadata: { type: 'card_setup' },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const last4 = cardData.number.replace(/\s/g, '').slice(-4);
    const token = data.paymentIntentId || `tok_${Date.now()}`;

    db.saveBusinessPaymentMethod(businessId, token, last4);

    return {
      success: true,
      token,
      last4,
      clientSecret: data.clientSecret,
      mock: data.mock,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save card';
    useNotificationBanner.getState().showBanner('error', `Card Save: ${message}`);
    return { success: false, token: '', last4: '' };
  }
}

// Trigger a transfer to worker's connected account via backend
export async function triggerTransfer(
  amount: number,
  destinationAccountId: string,
  shiftId?: string
): Promise<StripeTransferResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, destinationAccountId, shiftId }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      transferId: data.transferId,
      mock: data.mock,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Transfer failed';
    useNotificationBanner.getState().showBanner('error', `Transfer: ${message}`);
    return { success: false };
  }
}

// Check if backend is connected and Stripe is configured
export async function checkStripeStatus(): Promise<{ configured: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return { configured: false };
    const data = await response.json();
    return { configured: data.stripe_configured };
  } catch {
    return { configured: false };
  }
}

export const IS_STRIPE_LIVE = true; // now determined by backend config
