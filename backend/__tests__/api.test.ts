import { getStripeClient } from '../lib/stripe';
import { getTwilioClient, getTwilioPhoneNumber } from '../lib/twilio';

// Test lib/stripe.ts
describe('Stripe Client Library', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns null when STRIPE_SECRET_KEY is not set', () => {
    delete process.env.STRIPE_SECRET_KEY;
    const client = getStripeClient();
    expect(client).toBeNull();
  });

  test('returns null when STRIPE_SECRET_KEY starts with your_', () => {
    process.env.STRIPE_SECRET_KEY = 'your_stripe_secret_key';
    const client = getStripeClient();
    expect(client).toBeNull();
  });

  test('returns null when STRIPE_SECRET_KEY is empty string', () => {
    process.env.STRIPE_SECRET_KEY = '';
    const client = getStripeClient();
    expect(client).toBeNull();
  });

  test('returns a Stripe instance when key is configured', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_real_key_123';
    const client = getStripeClient();
    expect(client).not.toBeNull();
  });
});

// Test lib/twilio.ts
describe('Twilio Client Library', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns null when TWILIO_ACCOUNT_SID is not set', () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    const client = getTwilioClient();
    expect(client).toBeNull();
  });

  test('returns null when TWILIO_ACCOUNT_SID starts with your_', () => {
    process.env.TWILIO_ACCOUNT_SID = 'your_sid';
    process.env.TWILIO_AUTH_TOKEN = 'your_token';
    const client = getTwilioClient();
    expect(client).toBeNull();
  });

  test('returns a Twilio client when credentials are configured', () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC1234567890abcdef';
    process.env.TWILIO_AUTH_TOKEN = 'real_token_123';
    const client = getTwilioClient();
    expect(client).not.toBeNull();
  });

  test('getTwilioPhoneNumber returns configured number', () => {
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
    expect(getTwilioPhoneNumber()).toBe('+15551234567');
  });

  test('getTwilioPhoneNumber returns empty string when not set', () => {
    delete process.env.TWILIO_PHONE_NUMBER;
    expect(getTwilioPhoneNumber()).toBe('');
  });
});
