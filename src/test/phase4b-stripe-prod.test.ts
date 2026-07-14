import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../store/database';

// Mock import.meta.env for stripe config
vi.mock('../config/stripe', () => ({
  IS_STRIPE_LIVE: false,
  STRIPE_PUBLISHABLE_KEY: '',
  STRIPE_SECRET_KEY: '',
}));

describe('Phase 4B: Stripe Production Wiring (Mock Mode)', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('Data Model - Shift type includes stripe fields', () => {
    it('Shift supports stripe_payment_intent_id field', () => {
      const shift = db.getShiftById('shift_001');
      expect(shift).toBeDefined();
      // Field should be undefined by default (not set on seed data)
      expect(shift!.stripe_payment_intent_id).toBeUndefined();
    });

    it('Shift supports stripe_transfer_id field', () => {
      const shift = db.getShiftById('shift_001');
      expect(shift).toBeDefined();
      expect(shift!.stripe_transfer_id).toBeUndefined();
    });
  });

  describe('createShift - Mock Mode (IS_STRIPE_LIVE = false)', () => {
    it('creates a shift without stripe_payment_intent_id in mock mode', () => {
      const shift = db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Test Shift',
        description: 'Test',
        category: 'General',
        hourly_rate: 25,
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

      expect(shift.id).toBeDefined();
      expect(shift.stripe_payment_intent_id).toBeUndefined();
    });
  });

  describe('releaseFunds - Mock Mode', () => {
    it('releases funds without stripe_transfer_id in mock mode', () => {
      const result = db.releaseFunds('shift_006');
      expect(result).toBeDefined();
      expect(result!.status).toBe('paid');
      expect(result!.stripe_transfer_id).toBeUndefined();
    });

    it('creates a transaction record with platform fee', () => {
      db.releaseFunds('shift_006');
      const tx = db.getTransactionByShiftId('shift_006');
      expect(tx).toBeDefined();
      expect(tx!.platform_fee).toBeGreaterThan(0);
      expect(tx!.worker_payout).toBe(tx!.amount - tx!.platform_fee);
      // 10% fee check
      expect(tx!.platform_fee).toBeCloseTo(tx!.amount * 0.10, 2);
    });

    it('calculates correct fee amounts for shift_006 (35/hr * 5hrs)', () => {
      db.releaseFunds('shift_006');
      const tx = db.getTransactionByShiftId('shift_006');
      expect(tx!.amount).toBe(175); // 35 * 5
      expect(tx!.platform_fee).toBe(17.5); // 10%
      expect(tx!.worker_payout).toBe(157.5); // 90%
    });
  });

  describe('Transaction records', () => {
    it('getAllTransactions returns all transaction records', () => {
      db.releaseFunds('shift_006');
      const txs = db.getAllTransactions();
      expect(txs.length).toBeGreaterThan(0);
    });
  });
});
