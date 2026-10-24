// Backend API base URL configuration
// Set VITE_API_BASE_URL to your deployed backend's root URL (no trailing "/api"),
// e.g. http://localhost:3001 in development or https://your-backend.vercel.app in production.
//
// When VITE_API_BASE_URL is NOT set, the app runs in demo mode: Stripe and Twilio calls are
// simulated in the browser so the whole app can be tried without running the backend.
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

export const IS_BACKEND_CONFIGURED: boolean = rawBaseUrl.length > 0;

// Strip trailing slashes and an accidental trailing "/api", since every call already adds "/api/...".
export const API_BASE_URL: string = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export const IS_DEMO_MODE = !IS_BACKEND_CONFIGURED;
