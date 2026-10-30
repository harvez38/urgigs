import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../store/database';

// Seed: shift_004 and shift_005 are 'paid' between usr_biz_001 and usr_wrk_001
describe('Phase 6 - Ratings & Reviews', () => {
  beforeEach(() => {
    db.reset();
  });

  const employerReview = (overrides = {}) => ({
    shift_id: 'shift_004',
    reviewer_id: 'usr_biz_001',
    reviewee_id: 'usr_wrk_001',
    rating_stars: 5,
    feedback_text: 'Great work!',
    ...overrides,
  });

  describe('addReview', () => {
    it('stores a review for a paid shift between its two parties', () => {
      const review = db.addReview(employerReview());
      expect(review).toBeDefined();
      expect(review!.id).toMatch(/^rev_/);
      expect(db.getReviewsForUser('usr_wrk_001')).toHaveLength(1);
    });

    it('notifies the reviewee', () => {
      db.addReview(employerReview({ rating_stars: 4 }));
      const notifs = db.getNotificationsByUserId('usr_wrk_001');
      expect(notifs[0].message).toContain('4-star review');
    });

    it('rejects a second review of the same shift by the same reviewer', () => {
      db.addReview(employerReview());
      expect(db.addReview(employerReview({ rating_stars: 1 }))).toBeUndefined();
      expect(db.getReviewsForUser('usr_wrk_001')).toHaveLength(1);
    });

    it('rejects ratings outside 1-5', () => {
      expect(db.addReview(employerReview({ rating_stars: 0 }))).toBeUndefined();
      expect(db.addReview(employerReview({ rating_stars: 6 }))).toBeUndefined();
      expect(db.addReview(employerReview({ rating_stars: 3.5 }))).toBeUndefined();
    });

    it('rejects reviews on shifts that are not paid', () => {
      expect(db.addReview(employerReview({ shift_id: 'shift_001' }))).toBeUndefined();
    });

    it('rejects reviewers who were not part of the shift', () => {
      expect(db.addReview(employerReview({ reviewer_id: 'usr_adm_001' }))).toBeUndefined();
    });

    it('rejects self-reviews', () => {
      expect(db.addReview(employerReview({ reviewee_id: 'usr_biz_001' }))).toBeUndefined();
    });
  });

  describe('getAverageRating', () => {
    it('returns 0 with no reviews', () => {
      expect(db.getAverageRating('usr_wrk_001')).toBe(0);
    });

    it('averages all reviews received, rounded to one decimal', () => {
      db.addReview(employerReview({ rating_stars: 5 }));
      db.addReview(employerReview({ shift_id: 'shift_005', rating_stars: 4 }));
      expect(db.getAverageRating('usr_wrk_001')).toBe(4.5);
    });
  });

  describe('getUnreviewedPaidShifts', () => {
    it('lists paid shifts the user has not reviewed yet, per role', () => {
      const employerPending = db.getUnreviewedPaidShifts('usr_biz_001', 'business');
      const workerPending = db.getUnreviewedPaidShifts('usr_wrk_001', 'worker');
      expect(employerPending.map(s => s.id).sort()).toEqual(['shift_004', 'shift_005']);
      expect(workerPending.map(s => s.id).sort()).toEqual(['shift_004', 'shift_005']);
    });

    it('drops a shift once that user has reviewed it, without affecting the other party', () => {
      db.addReview(employerReview());
      expect(db.getUnreviewedPaidShifts('usr_biz_001', 'business').map(s => s.id)).toEqual(['shift_005']);
      expect(db.getUnreviewedPaidShifts('usr_wrk_001', 'worker')).toHaveLength(2);
    });
  });

  describe('getVerifiedWorkers', () => {
    it('excludes unverified workers', () => {
      expect(db.getVerifiedWorkers()).toHaveLength(0);
    });

    it('includes verified workers with their display name', () => {
      db.verifyWorker('usr_wrk_001');
      const workers = db.getVerifiedWorkers();
      expect(workers).toHaveLength(1);
      expect(workers[0].user_name).toBe('Sarah Martinez');
    });
  });
});
