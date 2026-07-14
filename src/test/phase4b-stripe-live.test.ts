import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IS_STRIPE_LIVE = true for live mode tests
vi.mock('../config/stripe', () => ({
  IS_STRIPE_LIVE: true,
  STRIPE_PUBLISHABLE_KEY: 'pk_test_realkey123',
  STRIPE_SECRET_KEY: 'sk_test_realkey123',
}));

import { db } from '../store/database';

describe('Phase 4B: Stripe Production Wiring (Live Mode)', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('createShift - Live Mode (IS_STRIPE_LIVE = true)', () => {
    it('creates a shift WITH stripe_payment_intent_id when live', () => {
      const shift = db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Live Test Shift',
        description: 'Test',
        category: 'General',
        hourly_rate: 30,
        start_time: '2026-08-01T09:00:00Z',
        end_time: '2026-08-01T17:00:00Z',
        location: '123 Main St',
        city: 'SF',
        state: 'CA',
        slots_total: 1,
        slots_filled: 0,
        status: 'open',
        requirements: [],
        check_in_time: null,
        check_out_time: null,
        actual_lat: null,
        actual_lng: null,
      });

      expect(shift.stripe_payment_intent_id).toBeDefined();
      expect(shift.stripe_payment_intent_id).toMatch(/^pi_live_/);
    });

    it('creates a transaction record with platform fee on shift creation', () => {
      const shift = db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Live Test Shift',
        description: 'Test',
        category: 'General',
        hourly_rate: 30,
        start_time: '2026-08-01T09:00:00Z',
        end_time: '2026-08-01T17:00:00Z',
        location: '123 Main St',
        city: 'SF',
        state: 'CA',
        slots_total: 1,
        slots_filled: 0,
        status: 'open',
        requirements: [],
        check_in_time: null,
        check_out_time: null,
        actual_lat: null,
        actual_lng: null,
      });

      const tx = db.getTransactionByShiftId(shift.id);
      expect(tx).toBeDefined();
      // 30/hr * 8 hrs = 240
      expect(tx!.amount).toBe(240);
      expect(tx!.platform_fee).toBe(24); // 10%
      expect(tx!.worker_payout).toBe(216); // 90%
      expect(tx!.stripe_payment_intent_id).toMatch(/^pi_live_/);
    });
  });

  describe('releaseFunds - Live Mode', () => {
    it('adds stripe_transfer_id to shift when live', () => {
      const result = db.releaseFunds('shift_006');
      expect(result).toBeDefined();
      expect(result!.status).toBe('paid');
      expect(result!.stripe_transfer_id).toBeDefined();
      expect(result!.stripe_transfer_id).toMatch(/^tr_live_/);
    });

    it('transaction record includes stripe_transfer_id', () => {
      db.releaseFunds('shift_006');
      const tx = db.getTransactionByShiftId('shift_006');
      expect(tx).toBeDefined();
      expect(tx!.stripe_transfer_id).toMatch(/^tr_live_/);
    });

    it('platform fee is always 10%', () => {
      db.releaseFunds('shift_006');
      const tx = db.getTransactionByShiftId('shift_006');
      expect(tx!.platform_fee / tx!.amount).toBeCloseTo(0.10, 5);
    });
  });

  describe('Existing functionality preserved', () => {
    it('releaseFunds still transitions from completed to paid', () => {
      expect(db.getShiftById('shift_006')!.status).toBe('completed');
      const result = db.releaseFunds('shift_006');
      expect(result!.status).toBe('paid');
    });

    it('releaseFunds returns undefined for non-completed shift', () => {
      expect(db.releaseFunds('shift_001')).toBeUndefined();
    });

    it('createShift still notifies workers', () => {
      const before = db.getNotificationsByUserId('usr_wrk_001').length;
      db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Notify Test',
        description: 'Test',
        category: 'General',
        hourly_rate: 20,
        start_time: '2026-08-01T09:00:00Z',
        end_time: '2026-08-01T17:00:00Z',
        location: '123 Main St',
        city: 'SF',
        state: 'CA',
        slots_total: 1,
        slots_filled: 0,
        status: 'open',
        requirements: [],
        check_in_time: null,
        check_out_time: null,
        actual_lat: null,
        actual_lng: null,
      });
      const after = db.getNotificationsByUserId('usr_wrk_001').length;
      expect(after).toBe(before + 1);
    });

    it('worker earnings calculations remain correct', () => {
      const earnings = db.getWorkerEarnings('usr_wrk_001');
      expect(earnings.totalEarned).toBeGreaterThan(0);
      expect(earnings.pendingPayouts).toBeGreaterThan(0);
    });
  });
});
