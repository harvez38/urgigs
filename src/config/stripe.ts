// Stripe Production Configuration
// Uses environment variables for secure key management
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || '';

// IS_STRIPE_LIVE is true only when real keys are configured
// (not placeholder values and not empty)
export const IS_STRIPE_LIVE: boolean = (() => {
  const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  const hasPublishableKey = pubKey.length > 0 && !pubKey.includes('REPLACE_WITH_REAL_KEY') && pubKey !== 'your_stripe_publishable_key_here';
  return hasPublishableKey;
})();
