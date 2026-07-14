import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../store/database';

describe('Phase 2 - Database Operations', () => {
  describe('Shift Creation', () => {
    it('should create a new shift with generated ID', () => {
      const shift = db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Test Shift',
        description: 'A test shift for unit testing',
        category: 'Testing',
        hourly_rate: 25,
        start_time: '2026-08-01T09:00:00Z',
        end_time: '2026-08-01T17:00:00Z',
        location: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 2,
        slots_filled: 0,
        status: 'open',
        requirements: ['Testing'],
      });

      expect(shift.id).toMatch(/^shift_/);
      expect(shift.title).toBe('Test Shift');
      expect(shift.hourly_rate).toBe(25);
      expect(shift.status).toBe('open');
      expect(shift.worker_id).toBeNull();
      expect(shift.created_at).toBeDefined();
    });

    it('should maintain FK integrity on new shift', () => {
      const shift = db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'FK Test',
        description: 'Testing FK integrity',
        category: 'Testing',
        hourly_rate: 20,
        start_time: '2026-08-02T10:00:00Z',
        end_time: '2026-08-02T18:00:00Z',
        location: 'Test location',
        city: 'SF',
        state: 'CA',
        slots_total: 1,
        slots_filled: 0,
        status: 'open',
        requirements: [],
      });

      const business = db.getBusinessProfileById(shift.business_id);
      expect(business).toBeDefined();
      expect(business!.id).toBe('biz_001');

      const poster = db.getUserById(shift.posted_by);
      expect(poster).toBeDefined();
      expect(poster!.id).toBe('usr_biz_001');
    });
  });

  describe('Claim Shift', () => {
    it('should claim an open shift and set worker_id', () => {
      const claimed = db.claimShift('shift_001', 'usr_wrk_001');
      expect(claimed).toBeDefined();
      expect(claimed!.worker_id).toBe('usr_wrk_001');
      expect(claimed!.status).toBe('assigned');
      expect(claimed!.slots_filled).toBe(1);
    });

    it('should not claim an already assigned shift', () => {
      const result = db.claimShift('shift_003', 'usr_wrk_001');
      expect(result).toBeUndefined();
    });

    it('should not claim a non-existent shift', () => {
      const result = db.claimShift('shift_nonexistent', 'usr_wrk_001');
      expect(result).toBeUndefined();
    });
  });

  describe('Worker Earnings', () => {
    it('should calculate earnings from completed and paid shifts', () => {
      const earnings = db.getWorkerEarnings('usr_wrk_001');
      expect(earnings.totalEarned).toBeGreaterThan(0);
      expect(earnings.history.length).toBeGreaterThan(0);
      earnings.history.forEach(s => {
        expect(['completed', 'paid']).toContain(s.status);
        expect(s.worker_id).toBe('usr_wrk_001');
      });
    });

    it('should calculate correct total from hourly_rate * hours', () => {
      const earnings = db.getWorkerEarnings('usr_wrk_001');
      let expectedTotal = 0;
      earnings.history.forEach(shift => {
        const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60);
        expectedTotal += shift.hourly_rate * hours;
      });
      expect(earnings.totalEarned).toBe(expectedTotal);
    });

    it('should return zero for a worker with no completed or paid shifts', () => {
      const earnings = db.getWorkerEarnings('usr_biz_001');
      expect(earnings.totalEarned).toBe(0);
      expect(earnings.history.length).toBe(0);
    });
  });

  describe('Profile Updates', () => {
    it('should update worker skills_tags', () => {
      const updated = db.updateWorkerProfile('wrk_001', {
        skills_tags: ['bartending', 'mixology', 'customer service'],
      });
      expect(updated).toBeDefined();
      expect(updated!.skills_tags).toContain('mixology');
      expect(updated!.skills_tags).not.toContain('food prep');
    });

    it('should update business company_name and location', () => {
      const updated = db.updateBusinessProfile('biz_001', {
        company_name: 'Chen Events LLC',
        city: 'Oakland',
      });
      expect(updated).toBeDefined();
      expect(updated!.company_name).toBe('Chen Events LLC');
      expect(updated!.city).toBe('Oakland');
      expect(updated!.state).toBe('CA'); // unchanged
    });

    it('should return undefined for non-existent profile', () => {
      const result = db.updateWorkerProfile('wrk_nonexistent', { skills_tags: [] });
      expect(result).toBeUndefined();
    });
  });

  describe('Shift Queries by Worker', () => {
    it('should get shifts assigned to a worker', () => {
      const shifts = db.getShiftsByWorkerId('usr_wrk_001');
      expect(shifts.length).toBeGreaterThan(0);
      shifts.forEach(s => expect(s.worker_id).toBe('usr_wrk_001'));
    });

    it('should get only paid shifts for worker', () => {
      const paid = db.getPaidShiftsByWorkerId('usr_wrk_001');
      expect(paid.length).toBeGreaterThan(0);
      paid.forEach(s => {
        expect(s.status).toBe('paid');
        expect(s.worker_id).toBe('usr_wrk_001');
      });
    });
  });
});
