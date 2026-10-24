import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../store/database';

// Seed data used here:
//  - shift_004 and shift_005 are 'paid' shifts posted by usr_biz_001 and worked by usr_wrk_001
//  - rev_001: employer already reviewed Sarah (usr_wrk_001) for shift_004
//  - shift_006 is 'completed' (not yet paid)

describe('Phase 6: Ratings & Reviews', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('getUnreviewedPaidShifts', () => {
    it('excludes shifts the employer already reviewed', () => {
      const ids = db.getUnreviewedPaidShifts('usr_biz_001', 'business').map(s => s.id);
      expect(ids).toEqual(['shift_005']);
    });

    it('lists every paid shift the worker has not reviewed', () => {
      const ids = db.getUnreviewedPaidShifts('usr_wrk_001', 'worker').map(s => s.id).sort();
      expect(ids).toEqual(['shift_004', 'shift_005']);
    });

    it('ignores shifts that are not paid yet', () => {
      const ids = db.getUnreviewedPaidShifts('usr_wrk_001', 'worker').map(s => s.id);
      expect(ids).not.toContain('shift_006');
    });

    it('shows a shift once it is paid', () => {
      db.releaseFunds('shift_006');
      const ids = db.getUnreviewedPaidShifts('usr_biz_001', 'business').map(s => s.id);
      expect(ids).toContain('shift_006');
    });
  });

  describe('addReview', () => {
    const workerReviewsEmployer = {
      shift_id: 'shift_005',
      reviewer_id: 'usr_wrk_001',
      reviewee_id: 'usr_biz_001',
      rating_stars: 4,
      feedback_text: '  Well organised event.  ',
    };

    it('stores a valid review and removes the shift from the pending list', () => {
      const review = db.addReview(workerReviewsEmployer);
      expect(review).toBeDefined();
      expect(review!.id).toMatch(/^rev_/);
      expect(review!.feedback_text).toBe('Well organised event.');
      expect(db.getUnreviewedPaidShifts('usr_wrk_001', 'worker').map(s => s.id)).not.toContain('shift_005');
    });

    it('notifies the person being reviewed', () => {
      db.addReview(workerReviewsEmployer);
      const notifs = db.getNotificationsByUserId('usr_biz_001');
      expect(notifs[0].message).toContain('4-star review');
    });

    it('rejects a second review of the same shift by the same reviewer', () => {
      expect(db.addReview(workerReviewsEmployer)).toBeDefined();
      expect(db.addReview(workerReviewsEmployer)).toBeUndefined();
      expect(db.getReviewsForUser('usr_biz_001')).toHaveLength(1);
    });

    it('rejects star ratings outside 1-5', () => {
      expect(db.addReview({ ...workerReviewsEmployer, rating_stars: 0 })).toBeUndefined();
      expect(db.addReview({ ...workerReviewsEmployer, rating_stars: 6 })).toBeUndefined();
    });

    it('rejects reviews for shifts that are not paid', () => {
      expect(db.addReview({ ...workerReviewsEmployer, shift_id: 'shift_006' })).toBeUndefined();
    });

    it('rejects reviews from people who were not on the shift', () => {
      expect(db.addReview({ ...workerReviewsEmployer, reviewer_id: 'usr_wrk_002' })).toBeUndefined();
    });

    it('rejects reviewing yourself', () => {
      expect(db.addReview({ ...workerReviewsEmployer, reviewee_id: 'usr_wrk_001' })).toBeUndefined();
    });
  });

  describe('getReviewsForUser / getAverageRating', () => {
    it('returns the seeded review for the worker', () => {
      const reviews = db.getReviewsForUser('usr_wrk_001');
      expect(reviews).toHaveLength(1);
      expect(reviews[0].rating_stars).toBe(5);
    });

    it('averages ratings and returns newest first', () => {
      db.addReview({
        shift_id: 'shift_005',
        reviewer_id: 'usr_biz_001',
        reviewee_id: 'usr_wrk_001',
        rating_stars: 4,
        feedback_text: 'Solid work.',
      });
      const reviews = db.getReviewsForUser('usr_wrk_001');
      expect(reviews[0].feedback_text).toBe('Solid work.');
      expect(db.getAverageRating('usr_wrk_001')).toBe(4.5);
    });

    it('returns 0 when a user has no reviews', () => {
      expect(db.getAverageRating('usr_biz_001')).toBe(0);
    });
  });

  describe('getVerifiedWorkers', () => {
    it('only includes verified workers, with their names', () => {
      const workers = db.getVerifiedWorkers();
      expect(workers.length).toBe(3);
      expect(workers.every(w => w.is_verified)).toBe(true);
      expect(workers.map(w => w.user_name)).toContain('Jordan Lee');
      // Sarah starts unverified
      expect(workers.map(w => w.user_id)).not.toContain('usr_wrk_001');
    });

    it('includes a worker once their background check passes', () => {
      db.updateBackgroundStatus('usr_wrk_001', 'passed');
      const names = db.getVerifiedWorkers().map(w => w.user_name);
      expect(names).toContain('Sarah Martinez');
    });
  });

  describe('createShift defaults', () => {
    it('fills in empty check-in fields when they are not provided', () => {
      const shift = db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Coat Check',
        description: 'Coat check attendant',
        category: 'General',
        hourly_rate: 20,
        start_time: '2026-08-01T18:00:00Z',
        end_time: '2026-08-01T22:00:00Z',
        location: '450 Market Street',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 1,
        slots_filled: 0,
        status: 'open',
        requirements: [],
      });
      expect(shift.check_in_time).toBeNull();
      expect(shift.check_out_time).toBeNull();
      expect(shift.actual_lat).toBeNull();
      expect(shift.actual_lng).toBeNull();
    });
  });
});

describe('review display helpers', () => {
  it('renderStars rounds to the nearest star and stays within 0-5', async () => {
    const { renderStars } = await import('../services/reviews');
    expect(renderStars(4.9)).toBe('★★★★★');
    expect(renderStars(4.4)).toBe('★★★★☆');
    expect(renderStars(0)).toBe('☆☆☆☆☆');
    expect(renderStars(7)).toBe('★★★★★');
  });
});
