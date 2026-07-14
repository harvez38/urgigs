// Stripe Configuration — Phase 5C
// Secret keys are now managed server-side only (in backend/.env.local)
// Frontend only needs the publishable key for Stripe Elements
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// IS_STRIPE_LIVE: determined by whether publishable key is configured
export const IS_STRIPE_LIVE: boolean = (() => {
  const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  return pubKey.length > 0 && !pubKey.includes('REPLACE_WITH_REAL_KEY') && pubKey !== 'your_stripe_publishable_key_here';
})();

// STRIPE_SECRET_KEY is no longer exposed on frontend — kept for backward compat with database.ts
export const STRIPE_SECRET_KEY = '';
