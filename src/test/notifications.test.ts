import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../store/database';

describe('Notification System - Database', () => {
  beforeEach(() => {
    db.reset();
  });

  describe('createNotification', () => {
    it('creates a notification with correct fields', () => {
      const notif = db.createNotification('usr_wrk_001', 'Test message');
      expect(notif.id).toMatch(/^notif_/);
      expect(notif.recipient_id).toBe('usr_wrk_001');
      expect(notif.message).toBe('Test message');
      expect(notif.is_read).toBe(false);
      expect(notif.created_at).toBeDefined();
    });
  });

  describe('getNotificationsByUserId', () => {
    it('returns notifications for specific user sorted newest first', async () => {
      db.createNotification('usr_wrk_001', 'First');
      await new Promise(r => setTimeout(r, 5));
      db.createNotification('usr_biz_001', 'Other user');
      await new Promise(r => setTimeout(r, 5));
      db.createNotification('usr_wrk_001', 'Second');

      const notifications = db.getNotificationsByUserId('usr_wrk_001');
      expect(notifications).toHaveLength(2);
      expect(notifications[0].message).toBe('Second');
      expect(notifications[1].message).toBe('First');
    });

    it('returns empty array for user with no notifications', () => {
      const notifications = db.getNotificationsByUserId('nonexistent');
      expect(notifications).toHaveLength(0);
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('counts only unread notifications', () => {
      db.createNotification('usr_wrk_001', 'Msg 1');
      db.createNotification('usr_wrk_001', 'Msg 2');
      expect(db.getUnreadNotificationCount('usr_wrk_001')).toBe(2);
    });

    it('returns 0 after marking all as read', () => {
      db.createNotification('usr_wrk_001', 'Msg');
      db.markNotificationsAsRead('usr_wrk_001');
      expect(db.getUnreadNotificationCount('usr_wrk_001')).toBe(0);
    });
  });

  describe('markNotificationsAsRead', () => {
    it('marks all notifications for user as read', () => {
      db.createNotification('usr_wrk_001', 'Msg 1');
      db.createNotification('usr_wrk_001', 'Msg 2');
      db.createNotification('usr_biz_001', 'Other');

      db.markNotificationsAsRead('usr_wrk_001');

      const workerNotifs = db.getNotificationsByUserId('usr_wrk_001');
      expect(workerNotifs.every(n => n.is_read)).toBe(true);

      // Other user's notifications should remain unread
      const bizNotifs = db.getNotificationsByUserId('usr_biz_001');
      expect(bizNotifs[0].is_read).toBe(false);
    });
  });

  describe('createShift trigger', () => {
    it('notifies all workers when a shift is created', () => {
      const shift = db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Dishwasher',
        description: 'Need dishwasher',
        category: 'Kitchen',
        hourly_rate: 15,
        start_time: '2026-08-01T08:00:00Z',
        end_time: '2026-08-01T16:00:00Z',
        location: '123 Main',
        city: 'SF',
        state: 'CA',
        slots_total: 1,
        slots_filled: 0,
        status: 'open',
        requirements: [],
      });

      const workerNotifs = db.getNotificationsByUserId('usr_wrk_001');
      expect(workerNotifs.length).toBeGreaterThanOrEqual(1);
      const found = workerNotifs.find(n => 
        n.message === `New Gig Alert: A business is looking for a ${shift.title}!`
      );
      expect(found).toBeDefined();
    });

    it('does not notify business users when a shift is created', () => {
      db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Host',
        description: 'Front of house',
        category: 'Hospitality',
        hourly_rate: 20,
        start_time: '2026-08-01T08:00:00Z',
        end_time: '2026-08-01T16:00:00Z',
        location: '123 Main',
        city: 'SF',
        state: 'CA',
        slots_total: 1,
        slots_filled: 0,
        status: 'open',
        requirements: [],
      });

      const bizNotifs = db.getNotificationsByUserId('usr_biz_001');
      const gigAlerts = bizNotifs.filter(n => n.message.includes('New Gig Alert'));
      expect(gigAlerts).toHaveLength(0);
    });
  });

  describe('claimShift trigger', () => {
    it('notifies business owner when shift is claimed', () => {
      const result = db.claimShift('shift_001', 'usr_wrk_001');
      expect(result).toBeDefined();

      const bizNotifs = db.getNotificationsByUserId('usr_biz_001');
      const found = bizNotifs.find(n => 
        n.message === 'Shift Filled! A worker has claimed your Bartender - Corporate Mixer slot.'
      );
      expect(found).toBeDefined();
    });

    it('does not create notification for invalid claim', () => {
      // Try to claim an already assigned shift
      const initialCount = db.getNotificationsByUserId('usr_biz_001').length;
      const result = db.claimShift('shift_003', 'usr_wrk_001'); // shift_003 is 'assigned'
      expect(result).toBeUndefined();

      const afterCount = db.getNotificationsByUserId('usr_biz_001').length;
      expect(afterCount).toBe(initialCount);
    });
  });

  describe('reset clears notifications', () => {
    it('clears all notifications on reset', () => {
      db.createNotification('usr_wrk_001', 'Test');
      db.reset();
      expect(db.getNotificationsByUserId('usr_wrk_001')).toHaveLength(0);
    });
  });
});
