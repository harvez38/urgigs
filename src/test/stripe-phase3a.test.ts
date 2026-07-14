import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../store/database';
import { onboardWorker, saveCreditCard } from '../services/stripe';

describe('Phase 3A: Stripe Connect Infrastructure', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('Data Model Updates', () => {
    it('WorkerProfile initializes with stripe_account_active = false', () => {
      const wp = db.getWorkerProfileByUserId('usr_wrk_001');
      expect(wp).toBeDefined();
      expect(wp!.stripe_account_active).toBe(false);
    });

    it('BusinessProfile initializes with default_payment_method = null', () => {
      const bp = db.getBusinessProfileByUserId('usr_biz_001');
      expect(bp).toBeDefined();
      expect(bp!.default_payment_method).toBeNull();
    });
  });

  describe('updateWorkerStripeStatus', () => {
    it('sets stripe_account_active to true', () => {
      const result = db.updateWorkerStripeStatus('usr_wrk_001', true);
      expect(result).toBeDefined();
      expect(result!.stripe_account_active).toBe(true);
    });

    it('sets stripe_account_active to false', () => {
      db.updateWorkerStripeStatus('usr_wrk_001', true);
      const result = db.updateWorkerStripeStatus('usr_wrk_001', false);
      expect(result).toBeDefined();
      expect(result!.stripe_account_active).toBe(false);
    });

    it('returns undefined for non-existent worker', () => {
      const result = db.updateWorkerStripeStatus('usr_nonexistent', true);
      expect(result).toBeUndefined();
    });

    it('persists status change in the profile store', () => {
      db.updateWorkerStripeStatus('usr_wrk_001', true);
      const wp = db.getWorkerProfileByUserId('usr_wrk_001');
      expect(wp!.stripe_account_active).toBe(true);
    });
  });

  describe('updateBusinessPaymentMethod', () => {
    it('saves a payment token', () => {
      const result = db.updateBusinessPaymentMethod('biz_001', 'tok_mock_123');
      expect(result).toBeDefined();
      expect(result!.default_payment_method).toBe('tok_mock_123');
    });

    it('returns undefined for non-existent business', () => {
      const result = db.updateBusinessPaymentMethod('biz_nonexistent', 'tok_mock_123');
      expect(result).toBeUndefined();
    });

    it('persists token in the business profile store', () => {
      db.updateBusinessPaymentMethod('biz_001', 'tok_mock_456');
      const bp = db.getBusinessProfileById('biz_001');
      expect(bp!.default_payment_method).toBe('tok_mock_456');
    });
  });

  describe('releaseFunds', () => {
    it('transitions shift from completed to paid', () => {
      // shift_006 is 'completed'
      const shift = db.getShiftById('shift_006');
      expect(shift!.status).toBe('completed');

      const result = db.releaseFunds('shift_006');
      expect(result).toBeDefined();
      expect(result!.status).toBe('paid');
    });

    it('returns undefined for non-completed shifts', () => {
      // shift_001 is 'open'
      expect(db.releaseFunds('shift_001')).toBeUndefined();
      // shift_004 is already 'paid'
      expect(db.releaseFunds('shift_004')).toBeUndefined();
    });

    it('returns undefined for non-existent shift', () => {
      expect(db.releaseFunds('shift_nonexistent')).toBeUndefined();
    });

    it('updates earnings calculations after release', () => {
      const earningsBefore = db.getWorkerEarnings('usr_wrk_001');
      const pendingBefore = earningsBefore.pendingPayouts;
      expect(pendingBefore).toBeGreaterThan(0);

      db.releaseFunds('shift_006');

      const earningsAfter = db.getWorkerEarnings('usr_wrk_001');
      expect(earningsAfter.pendingPayouts).toBe(0);
      // total should stay the same
      expect(earningsAfter.totalEarned).toBe(earningsBefore.totalEarned);
    });
  });

  describe('Stripe Service - onboardWorker', () => {
    it('returns success and account id', async () => {
      const result = await onboardWorker('usr_wrk_001');
      expect(result.success).toBe(true);
      expect(result.accountId).toContain('acct_mock_');
    });

    it('activates stripe on the worker profile', async () => {
      await onboardWorker('usr_wrk_001');
      const wp = db.getWorkerProfileByUserId('usr_wrk_001');
      expect(wp!.stripe_account_active).toBe(true);
    });
  });

  describe('Stripe Service - saveCreditCard', () => {
    it('returns success and mock token', async () => {
      const result = await saveCreditCard('biz_001', {
        number: '4242424242424242',
        expiry: '12/28',
        cvc: '123',
      });
      expect(result.success).toBe(true);
      expect(result.token).toBe('tok_mock_123');
    });

    it('saves payment method to business profile', async () => {
      await saveCreditCard('biz_001', {
        number: '4242424242424242',
        expiry: '12/28',
        cvc: '123',
      });
      const bp = db.getBusinessProfileById('biz_001');
      expect(bp!.default_payment_method).toBe('tok_mock_123');
    });
  });

  describe('Relational Integrity', () => {
    it('shifts remain properly linked to workers after releaseFunds', () => {
      db.releaseFunds('shift_006');
      const shift = db.getShiftById('shift_006');
      expect(shift!.worker_id).toBe('usr_wrk_001');
      expect(shift!.business_id).toBe('biz_001');
    });

    it('worker profile remains intact after stripe onboarding', async () => {
      await onboardWorker('usr_wrk_001');
      const wp = db.getWorkerProfileByUserId('usr_wrk_001');
      expect(wp!.skills_tags).toContain('bartending');
      expect(wp!.gigs_completed).toBe(47);
      expect(wp!.user_id).toBe('usr_wrk_001');
    });

    it('business profile remains intact after payment method save', async () => {
      await saveCreditCard('biz_001', { number: '4242', expiry: '12/28', cvc: '123' });
      const bp = db.getBusinessProfileById('biz_001');
      expect(bp!.company_name).toBe('Chen Events Co.');
      expect(bp!.user_id).toBe('usr_biz_001');
      expect(bp!.verified).toBe(true);
    });
  });
});
