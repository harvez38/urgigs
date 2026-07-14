import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../store/database';

describe('Shift Verification and Earnings Tracking', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('getWorkerEarnings', () => {
    it('should return totalEarned as sum of completed + paid shifts', () => {
      const result = db.getWorkerEarnings('usr_wrk_001');
      // shift_004: paid, 7h @ $30 = $210
      // shift_005: paid, 5h @ $20 = $100
      // shift_006: completed, 5h @ $35 = $175
      expect(result.totalEarned).toBe(210 + 100 + 175);
    });

    it('should return pendingPayouts as sum of completed (not paid) shifts', () => {
      const result = db.getWorkerEarnings('usr_wrk_001');
      // shift_006: completed, 5h @ $35 = $175
      expect(result.pendingPayouts).toBe(175);
    });

    it('should return history sorted newest first', () => {
      const result = db.getWorkerEarnings('usr_wrk_001');
      expect(result.history.length).toBe(3);
      // shift_006 (Jul 1) > shift_005 (Jun 28) > shift_004 (Jun 15)
      expect(result.history[0].id).toBe('shift_006');
      expect(result.history[1].id).toBe('shift_005');
      expect(result.history[2].id).toBe('shift_004');
    });

    it('should include company_name in history entries', () => {
      const result = db.getWorkerEarnings('usr_wrk_001');
      result.history.forEach(entry => {
        expect(entry.company_name).toBe('Chen Events Co.');
      });
    });

    it('should include estimated_total_pay (hours * rate) in history', () => {
      const result = db.getWorkerEarnings('usr_wrk_001');
      // shift_006: 5h @ $35 = $175
      expect(result.history[0].estimated_total_pay).toBe(175);
      // shift_005: 5h @ $20 = $100
      expect(result.history[1].estimated_total_pay).toBe(100);
      // shift_004: 7h @ $30 = $210
      expect(result.history[2].estimated_total_pay).toBe(210);
    });

    it('should return zeros for worker with no earnings', () => {
      const result = db.getWorkerEarnings('usr_nonexistent');
      expect(result.totalEarned).toBe(0);
      expect(result.pendingPayouts).toBe(0);
      expect(result.history).toHaveLength(0);
    });
  });

  describe('getShiftsByEmployerAndStatus', () => {
    it('should return assigned shifts for employer', () => {
      const assigned = db.getShiftsByEmployerAndStatus('usr_biz_001', 'assigned');
      expect(assigned.length).toBe(1);
      expect(assigned[0].id).toBe('shift_003');
      expect(assigned[0].status).toBe('assigned');
    });

    it('should return open shifts for employer', () => {
      const open = db.getShiftsByEmployerAndStatus('usr_biz_001', 'open');
      expect(open.length).toBe(2);
      open.forEach(s => expect(s.status).toBe('open'));
    });

    it('should return empty for non-existent employer', () => {
      const result = db.getShiftsByEmployerAndStatus('no_one', 'assigned');
      expect(result).toHaveLength(0);
    });
  });

  describe('getShiftsByEmployerAndStatusWithBusiness', () => {
    it('should return shifts with business info', () => {
      const result = db.getShiftsByEmployerAndStatusWithBusiness('usr_biz_001', 'assigned');
      expect(result.length).toBe(1);
      expect(result[0].company_name).toBe('Chen Events Co.');
      expect(result[0].estimated_total_pay).toBe(7 * 25); // 7h @ $25
    });
  });

  describe('Approve for Payment flow (status: assigned -> completed)', () => {
    it('should update shift status from assigned to completed', () => {
      const shift = db.getShiftById('shift_003');
      expect(shift!.status).toBe('assigned');

      const updated = db.updateShift('shift_003', { status: 'completed' });
      expect(updated!.status).toBe('completed');

      const verified = db.getShiftById('shift_003');
      expect(verified!.status).toBe('completed');
    });

    it('should reflect in worker earnings after approval', () => {
      // Before approval
      const before = db.getWorkerEarnings('usr_wrk_001');
      expect(before.pendingPayouts).toBe(175); // only shift_006

      // Approve shift_003
      db.updateShift('shift_003', { status: 'completed' });

      // After approval: shift_003 (7h @ $25 = $175) now included
      const after = db.getWorkerEarnings('usr_wrk_001');
      expect(after.pendingPayouts).toBe(175 + 175);
      expect(after.totalEarned).toBe(210 + 100 + 175 + 175);
      expect(after.history.length).toBe(4);
    });

    it('should no longer appear in assigned shifts for employer', () => {
      const beforeAssigned = db.getShiftsByEmployerAndStatus('usr_biz_001', 'assigned');
      expect(beforeAssigned.length).toBe(1);

      db.updateShift('shift_003', { status: 'completed' });

      const afterAssigned = db.getShiftsByEmployerAndStatus('usr_biz_001', 'assigned');
      expect(afterAssigned.length).toBe(0);
    });
  });

  describe('getCompletedShiftsByWorkerId', () => {
    it('should return only completed shifts', () => {
      const completed = db.getCompletedShiftsByWorkerId('usr_wrk_001');
      expect(completed.length).toBe(1);
      expect(completed[0].id).toBe('shift_006');
      expect(completed[0].status).toBe('completed');
    });
  });

  describe('Earnings math accuracy (Hours * Rate)', () => {
    it('should calculate pay correctly for shift_004 (7h @ $30)', () => {
      const shift = db.getShiftById('shift_004')!;
      const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
      expect(hours).toBe(7);
      expect(hours * shift.hourly_rate).toBe(210);
    });

    it('should calculate pay correctly for shift_005 (5h @ $20)', () => {
      const shift = db.getShiftById('shift_005')!;
      const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
      expect(hours).toBe(5);
      expect(hours * shift.hourly_rate).toBe(100);
    });

    it('should calculate pay correctly for shift_006 (5h @ $35)', () => {
      const shift = db.getShiftById('shift_006')!;
      const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
      expect(hours).toBe(5);
      expect(hours * shift.hourly_rate).toBe(175);
    });
  });
});
