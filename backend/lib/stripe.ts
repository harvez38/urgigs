import Stripe from 'stripe';

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith('your_') || key.length === 0) {
    return null;
  }
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

export { getStripeClient };
