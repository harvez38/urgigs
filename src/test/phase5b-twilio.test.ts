import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the twilio service module before importing database
vi.mock('../services/twilio', () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true, sid: 'mock_sms_test' }),
  IS_TWILIO_LIVE: false,
}));

import { db } from '../store/database';
import { sendSMS } from '../services/twilio';

const mockedSendSMS = vi.mocked(sendSMS);

describe('Phase 5B - Twilio SMS Alert System', () => {
  beforeEach(() => {
    db.reset();
    mockedSendSMS.mockClear();
  });

  describe('sendSMS service', () => {
    it('exports sendSMS function', () => {
      expect(sendSMS).toBeDefined();
      expect(typeof sendSMS).toBe('function');
    });

    it('returns success result', async () => {
      const result = await sendSMS('+1-555-0202', 'Test message');
      expect(result.success).toBe(true);
    });
  });

  describe('createShift triggers SMS to all workers', () => {
    it('sends SMS to each worker when a new shift is created', () => {
      mockedSendSMS.mockClear();

      db.createShift({
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
        check_in_time: null,
        check_out_time: null,
        actual_lat: null,
        actual_lng: null,
      });

      // Should have called sendSMS for the worker user
      expect(mockedSendSMS).toHaveBeenCalled();

      // Find the call that was to the worker
      const workerCall = mockedSendSMS.mock.calls.find(
        call => call[0] === '+1-555-0202'
      );
      expect(workerCall).toBeDefined();
      expect(workerCall![1]).toContain('UrGigs Alert: A new Dishwasher shift paying $15/hr is available!');
      expect(workerCall![1]).toContain('Open the app to claim it.');
    });

    it('SMS message includes correct role title and hourly rate', () => {
      mockedSendSMS.mockClear();

      db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Lead Bartender',
        description: 'Premium event',
        category: 'Bartending',
        hourly_rate: 45,
        start_time: '2026-08-05T18:00:00Z',
        end_time: '2026-08-06T02:00:00Z',
        location: 'Downtown Club',
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

      const workerCall = mockedSendSMS.mock.calls.find(
        call => call[0] === '+1-555-0202'
      );
      expect(workerCall).toBeDefined();
      expect(workerCall![1]).toBe(
        'UrGigs Alert: A new Lead Bartender shift paying $45/hr is available! Open the app to claim it.'
      );
    });

    it('does not send SMS to business or admin users', () => {
      mockedSendSMS.mockClear();

      db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Host',
        description: 'Front desk',
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
        check_in_time: null,
        check_out_time: null,
        actual_lat: null,
        actual_lng: null,
      });

      // Should NOT have sent to business user (+1-555-0101) or admin (+1-555-0000)
      const bizCall = mockedSendSMS.mock.calls.find(
        call => call[0] === '+1-555-0101'
      );
      const adminCall = mockedSendSMS.mock.calls.find(
        call => call[0] === '+1-555-0000'
      );
      expect(bizCall).toBeUndefined();
      expect(adminCall).toBeUndefined();
    });
  });

  describe('claimShift triggers SMS to employer', () => {
    it('sends SMS to employer when a worker claims a shift', () => {
      mockedSendSMS.mockClear();

      const result = db.claimShift('shift_001', 'usr_wrk_001');
      expect(result).toBeDefined();
      expect(result!.status).toBe('assigned');

      // Should have called sendSMS to employer phone
      const employerCall = mockedSendSMS.mock.calls.find(
        call => call[0] === '+1-555-0101'
      );
      expect(employerCall).toBeDefined();
      expect(employerCall![1]).toContain('UrGigs Alert: Your Bartender - Corporate Mixer shift on');
      expect(employerCall![1]).toContain('has been claimed by Sarah Martinez!');
    });

    it('SMS includes correct shift date', () => {
      mockedSendSMS.mockClear();

      db.claimShift('shift_001', 'usr_wrk_001');

      const employerCall = mockedSendSMS.mock.calls.find(
        call => call[0] === '+1-555-0101'
      );
      expect(employerCall).toBeDefined();

      // shift_001 start_time is '2026-07-20T17:00:00Z'
      const expectedDate = new Date('2026-07-20T17:00:00Z').toLocaleDateString();
      expect(employerCall![1]).toContain(expectedDate);
    });

    it('does not send SMS when claim fails (non-open shift)', () => {
      mockedSendSMS.mockClear();

      // shift_003 is 'assigned' — should fail
      const result = db.claimShift('shift_003', 'usr_wrk_001');
      expect(result).toBeUndefined();
      expect(mockedSendSMS).not.toHaveBeenCalled();
    });

    it('does not crash when shift or user is invalid', () => {
      mockedSendSMS.mockClear();

      const result = db.claimShift('nonexistent_shift', 'usr_wrk_001');
      expect(result).toBeUndefined();
      expect(mockedSendSMS).not.toHaveBeenCalled();
    });
  });

  describe('existing notification behavior preserved', () => {
    it('still creates in-app notifications for workers on shift creation', () => {
      db.createShift({
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Valet',
        description: 'Parking',
        category: 'Service',
        hourly_rate: 18,
        start_time: '2026-08-01T08:00:00Z',
        end_time: '2026-08-01T16:00:00Z',
        location: '123 Main',
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

      const workerNotifs = db.getNotificationsByUserId('usr_wrk_001');
      const found = workerNotifs.find(n =>
        n.message === 'New Gig Alert: A business is looking for a Valet!'
      );
      expect(found).toBeDefined();
    });

    it('still creates in-app notification for employer on shift claim', () => {
      db.claimShift('shift_001', 'usr_wrk_001');

      const bizNotifs = db.getNotificationsByUserId('usr_biz_001');
      const found = bizNotifs.find(n =>
        n.message === 'Shift Filled! A worker has claimed your Bartender - Corporate Mixer slot.'
      );
      expect(found).toBeDefined();
    });
  });
});
