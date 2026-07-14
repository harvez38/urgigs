import { describe, it, expect } from 'vitest';
import { db } from '../store/database';

describe('MockDatabase', () => {
  describe('Users table', () => {
    it('should have seeded business user', () => {
      const user = db.findUserByEmail('employer@urgigs.com');
      expect(user).toBeDefined();
      expect(user!.role).toBe('business');
      expect(user!.full_name).toBe('Marcus Chen');
      expect(user!.id).toBe('usr_biz_001');
    });

    it('should have seeded worker user', () => {
      const user = db.findUserByEmail('worker@urgigs.com');
      expect(user).toBeDefined();
      expect(user!.role).toBe('worker');
      expect(user!.full_name).toBe('Sarah Martinez');
      expect(user!.id).toBe('usr_wrk_001');
    });

    it('should return undefined for non-existent email', () => {
      const user = db.findUserByEmail('notfound@test.com');
      expect(user).toBeUndefined();
    });

    it('should get user by ID', () => {
      const user = db.getUserById('usr_biz_001');
      expect(user).toBeDefined();
      expect(user!.email).toBe('employer@urgigs.com');
    });

    it('should list all users', () => {
      const users = db.getAllUsers();
      expect(users.length).toBe(3);
    });
  });

  describe('Business Profiles table', () => {
    it('should have FK relationship to users table', () => {
      const profile = db.getBusinessProfileByUserId('usr_biz_001');
      expect(profile).toBeDefined();
      expect(profile!.user_id).toBe('usr_biz_001');
      expect(profile!.company_name).toBe('Chen Events Co.');
    });

    it('should return undefined for non-business user', () => {
      const profile = db.getBusinessProfileByUserId('usr_wrk_001');
      expect(profile).toBeUndefined();
    });

    it('should get profile by ID', () => {
      const profile = db.getBusinessProfileById('biz_001');
      expect(profile).toBeDefined();
      expect(profile!.verified).toBe(true);
    });
  });

  describe('Worker Profiles table', () => {
    it('should have FK relationship to users table', () => {
      const profile = db.getWorkerProfileByUserId('usr_wrk_001');
      expect(profile).toBeDefined();
      expect(profile!.user_id).toBe('usr_wrk_001');
      expect(profile!.skills_tags).toContain('bartending');
    });

    it('should return undefined for non-worker user', () => {
      const profile = db.getWorkerProfileByUserId('usr_biz_001');
      expect(profile).toBeUndefined();
    });

    it('should have proper rating and gig count', () => {
      const profile = db.getWorkerProfileById('wrk_001');
      expect(profile!.rating).toBe(4.8);
      expect(profile!.gigs_completed).toBe(47);
    });
  });

  describe('Shifts table', () => {
    it('should have FK relationship to business_profiles', () => {
      const shifts = db.getShiftsByBusinessId('biz_001');
      expect(shifts.length).toBeGreaterThan(0);
      shifts.forEach(s => expect(s.business_id).toBe('biz_001'));
    });

    it('should have FK relationship to users (posted_by)', () => {
      const shifts = db.getShiftsByPosterId('usr_biz_001');
      expect(shifts.length).toBe(6);
      shifts.forEach(s => expect(s.posted_by).toBe('usr_biz_001'));
    });

    it('should filter open shifts', () => {
      const openShifts = db.getOpenShifts();
      expect(openShifts.length).toBe(2);
      openShifts.forEach(s => expect(s.status).toBe('open'));
    });

    it('should get shift by ID', () => {
      const shift = db.getShiftById('shift_001');
      expect(shift).toBeDefined();
      expect(shift!.title).toContain('Bartender');
      expect(shift!.hourly_rate).toBe(28);
    });

    it('should join shifts with business data', () => {
      const joined = db.getShiftsWithBusiness();
      expect(joined.length).toBeGreaterThan(0);
      joined.forEach(s => {
        expect(s.business).toBeDefined();
        expect(s.business.id).toBe(s.business_id);
      });
    });

    it('should have proper shift structure', () => {
      const shift = db.getShiftById('shift_002');
      expect(shift!.requirements).toBeInstanceOf(Array);
      expect(shift!.slots_total).toBeGreaterThan(0);
      expect(shift!.category).toBe('Event Setup');
    });
  });
});
