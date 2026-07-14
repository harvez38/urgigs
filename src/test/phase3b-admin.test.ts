import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../store/database';

describe('Phase 3B: Admin Dashboard & Dispute Resolution', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('Admin user seeding', () => {
    it('should have an admin user with correct credentials', () => {
      const admin = db.findUserByEmail('admin@urgigs.com');
      expect(admin).toBeDefined();
      expect(admin!.role).toBe('admin');
      expect(admin!.full_name).toBe('UrGigs Admin');
    });
  });

  describe('verifyWorker', () => {
    it('should set is_verified to true on the worker profile', () => {
      const worker = db.findUserByEmail('worker@urgigs.com');
      expect(worker).toBeDefined();

      const profileBefore = db.getWorkerProfileByUserId(worker!.id);
      expect(profileBefore?.is_verified).toBe(false);

      const result = db.verifyWorker(worker!.id);
      expect(result).toBeDefined();
      expect(result!.is_verified).toBe(true);

      const profileAfter = db.getWorkerProfileByUserId(worker!.id);
      expect(profileAfter?.is_verified).toBe(true);
    });

    it('should return undefined for non-existent worker', () => {
      const result = db.verifyWorker('nonexistent_id');
      expect(result).toBeUndefined();
    });
  });

  describe('disputeShift', () => {
    it('should set shift status to disputed', () => {
      const shift = db.getShiftById('shift_003');
      expect(shift).toBeDefined();
      expect(shift!.status).toBe('assigned');

      const result = db.disputeShift('shift_003');
      expect(result).toBeDefined();
      expect(result!.status).toBe('disputed');

      const updatedShift = db.getShiftById('shift_003');
      expect(updatedShift!.status).toBe('disputed');
    });

    it('should return undefined for non-existent shift', () => {
      const result = db.disputeShift('nonexistent_shift');
      expect(result).toBeUndefined();
    });
  });

  describe('resolveDispute', () => {
    beforeEach(() => {
      db.disputeShift('shift_003');
    });

    it('should resolve dispute with approve -> status becomes completed', () => {
      const result = db.resolveDispute('shift_003', 'approve');
      expect(result).toBeDefined();
      expect(result!.status).toBe('completed');
    });

    it('should resolve dispute with refund -> status becomes cancelled', () => {
      const result = db.resolveDispute('shift_003', 'refund');
      expect(result).toBeDefined();
      expect(result!.status).toBe('cancelled');
    });

    it('should return undefined if shift is not disputed', () => {
      const result = db.resolveDispute('shift_001', 'approve');
      expect(result).toBeUndefined();
    });

    it('should send notifications to both worker and employer on resolution', () => {
      const shift = db.getShiftById('shift_003');
      db.resolveDispute('shift_003', 'approve');

      const workerNotifs = db.getNotificationsByUserId(shift!.worker_id!);
      const approveNotif = workerNotifs.find(n => n.message.includes('approved'));
      expect(approveNotif).toBeDefined();

      const employerNotifs = db.getNotificationsByUserId(shift!.posted_by);
      const employerNotif = employerNotifs.find(n => n.message.includes('approved'));
      expect(employerNotif).toBeDefined();
    });
  });

  describe('getAdminStats', () => {
    it('should return correct platform volume and fees', () => {
      const stats = db.getAdminStats();

      const expectedVolume = 210 + 100 + 175;
      const expectedFees = expectedVolume * 0.10;

      expect(stats.totalVolume).toBe(expectedVolume);
      expect(stats.totalFees).toBe(expectedFees);
      expect(stats.totalShifts).toBe(6);
      expect(stats.completedShifts).toBe(3);
      expect(stats.disputedShifts).toBe(0);
    });

    it('should update disputed count after disputing a shift', () => {
      db.disputeShift('shift_003');
      const stats = db.getAdminStats();
      expect(stats.disputedShifts).toBe(1);
    });
  });

  describe('getDisputedShifts', () => {
    it('should return empty array when no disputes', () => {
      const disputed = db.getDisputedShifts();
      expect(disputed).toHaveLength(0);
    });

    it('should return disputed shifts after flagging', () => {
      db.disputeShift('shift_003');
      db.disputeShift('shift_006');
      const disputed = db.getDisputedShifts();
      expect(disputed).toHaveLength(2);
      expect(disputed.every(s => s.status === 'disputed')).toBe(true);
    });
  });

  describe('ShiftStatus type includes disputed', () => {
    it('should allow disputed status on shifts', () => {
      const shift = db.disputeShift('shift_003');
      expect(shift?.status).toBe('disputed');
    });
  });

  describe('WorkerProfile includes is_verified', () => {
    it('should have is_verified field on worker profiles', () => {
      const worker = db.findUserByEmail('worker@urgigs.com');
      const profile = db.getWorkerProfileByUserId(worker!.id);
      expect(profile).toBeDefined();
      expect('is_verified' in profile!).toBe(true);
      expect(typeof profile!.is_verified).toBe('boolean');
    });
  });

  describe('getAllWorkerProfiles', () => {
    it('should return all worker profiles', () => {
      const profiles = db.getAllWorkerProfiles();
      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles[0].user_id).toBeDefined();
    });
  });
});
