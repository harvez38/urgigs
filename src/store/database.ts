import { User, BusinessProfile, WorkerProfile, Shift, Notification } from '../types';

export interface ShiftWithBusiness extends Shift {
  company_name: string;
  estimated_total_pay: number;
}

export interface WorkerEarningsResult {
  totalEarned: number;
  pendingPayouts: number;
  history: ShiftWithBusiness[];
}

class MockDatabase {
  private users: Map<string, User> = new Map();
  private businessProfiles: Map<string, BusinessProfile> = new Map();
  private workerProfiles: Map<string, WorkerProfile> = new Map();
  private shifts: Map<string, Shift> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private idCounter = 100;
  private notifCounter = 0;

  constructor() {
    this.seed();
  }

  private generateId(prefix: string): string {
    this.idCounter++;
    return `${prefix}_${this.idCounter}`;
  }

  private seed() {
    const businessUser: User = {
      id: 'usr_biz_001',
      email: 'employer@urgigs.com',
      password_hash: 'hashed_password_123',
      role: 'business',
      full_name: 'Marcus Chen',
      phone: '+1-555-0101',
      avatar_url: null,
      created_at: '2026-01-15T08:00:00Z',
      updated_at: '2026-07-10T14:30:00Z',
    };

    const workerUser: User = {
      id: 'usr_wrk_001',
      email: 'worker@urgigs.com',
      password_hash: 'hashed_password_456',
      role: 'worker',
      full_name: 'Sarah Martinez',
      phone: '+1-555-0202',
      avatar_url: null,
      created_at: '2026-02-20T10:00:00Z',
      updated_at: '2026-07-12T09:15:00Z',
    };

    this.users.set(businessUser.id, businessUser);
    this.users.set(workerUser.id, workerUser);

    const businessProfile: BusinessProfile = {
      id: 'biz_001',
      user_id: 'usr_biz_001',
      company_name: 'Chen Events Co.',
      industry: 'Event Services',
      description: 'Premium event staffing and coordination services in the Bay Area.',
      address: '450 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      verified: true,
      default_payment_method: null,
      payment_last4: null,
      created_at: '2026-01-15T08:30:00Z',
    };

    this.businessProfiles.set(businessProfile.id, businessProfile);

    const workerProfile: WorkerProfile = {
      id: 'wrk_001',
      user_id: 'usr_wrk_001',
      skills_tags: ['bartending', 'event setup', 'customer service', 'food prep'],
      hourly_rate_min: 18,
      hourly_rate_max: 35,
      availability: 'flexible',
      experience_years: 3,
      bio: 'Experienced event worker with bartending certification and excellent customer service skills.',
      rating: 4.8,
      gigs_completed: 47,
      stripe_account_active: false,
      created_at: '2026-02-20T10:30:00Z',
    };

    this.workerProfiles.set(workerProfile.id, workerProfile);

    const shifts: Shift[] = [
      {
        id: 'shift_001',
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Bartender - Corporate Mixer',
        description: 'Looking for experienced bartender for a corporate networking event. Must be comfortable with craft cocktails.',
        category: 'Bartending',
        hourly_rate: 28,
        start_time: '2026-07-20T17:00:00Z',
        end_time: '2026-07-20T23:00:00Z',
        location: '450 Market Street',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 2,
        slots_filled: 0,
        status: 'open',
        requirements: ['Bartending license', '2+ years experience'],
        created_at: '2026-07-10T09:00:00Z',
        updated_at: '2026-07-10T09:00:00Z',
      },
      {
        id: 'shift_002',
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: null,
        title: 'Event Setup Crew',
        description: 'Need strong individuals for event setup including table/chair arrangement, decorations, and AV equipment.',
        category: 'Event Setup',
        hourly_rate: 22,
        start_time: '2026-07-22T08:00:00Z',
        end_time: '2026-07-22T14:00:00Z',
        location: 'Moscone Center',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 4,
        slots_filled: 1,
        status: 'open',
        requirements: ['Physical fitness', 'Punctual'],
        created_at: '2026-07-11T11:00:00Z',
        updated_at: '2026-07-11T11:00:00Z',
      },
      {
        id: 'shift_003',
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: 'usr_wrk_001',
        title: 'Catering Server - Wedding',
        description: 'Upscale wedding reception. Professional attire required. Experience with plated service preferred.',
        category: 'Catering',
        hourly_rate: 25,
        start_time: '2026-07-25T15:00:00Z',
        end_time: '2026-07-25T22:00:00Z',
        location: 'The Ritz-Carlton',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 6,
        slots_filled: 3,
        status: 'assigned',
        requirements: ['Food handler cert', 'Professional appearance'],
        created_at: '2026-07-12T08:00:00Z',
        updated_at: '2026-07-13T10:00:00Z',
      },
      {
        id: 'shift_004',
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: 'usr_wrk_001',
        title: 'Cocktail Server - Rooftop Party',
        description: 'VIP rooftop party downtown. Need experienced server for craft cocktail service.',
        category: 'Bartending',
        hourly_rate: 30,
        start_time: '2026-06-15T18:00:00Z',
        end_time: '2026-06-16T01:00:00Z',
        location: '555 California St',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 2,
        slots_filled: 2,
        status: 'paid',
        requirements: ['Bartending license'],
        created_at: '2026-06-10T09:00:00Z',
        updated_at: '2026-06-17T08:00:00Z',
      },
      {
        id: 'shift_005',
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: 'usr_wrk_001',
        title: 'Event Cleanup - Tech Conference',
        description: 'Post-event breakdown and cleanup for tech conference.',
        category: 'Event Setup',
        hourly_rate: 20,
        start_time: '2026-06-28T22:00:00Z',
        end_time: '2026-06-29T03:00:00Z',
        location: 'Moscone Center',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 3,
        slots_filled: 3,
        status: 'paid',
        requirements: ['Physical fitness'],
        created_at: '2026-06-25T10:00:00Z',
        updated_at: '2026-06-30T09:00:00Z',
      },
      {
        id: 'shift_006',
        business_id: 'biz_001',
        posted_by: 'usr_biz_001',
        worker_id: 'usr_wrk_001',
        title: 'Waiter - Private Dinner',
        description: 'Formal private dinner for 20 guests. White glove service required.',
        category: 'Catering',
        hourly_rate: 35,
        start_time: '2026-07-01T18:00:00Z',
        end_time: '2026-07-01T23:00:00Z',
        location: 'Pacific Heights Residence',
        city: 'San Francisco',
        state: 'CA',
        slots_total: 2,
        slots_filled: 2,
        status: 'completed',
        requirements: ['Fine dining experience'],
        created_at: '2026-06-28T08:00:00Z',
        updated_at: '2026-07-02T08:00:00Z',
      },
    ];

    shifts.forEach(s => this.shifts.set(s.id, s));
  }

  // Notification operations
  createNotification(recipientId: string, message: string): Notification {
    const notification: Notification = {
      id: this.generateId('notif'),
      recipient_id: recipientId,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  getNotificationsByUserId(userId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.recipient_id === userId)
      .sort((a, b) => {
        const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.id.localeCompare(a.id);
      });
  }

  getUnreadNotificationCount(userId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.recipient_id === userId && !n.is_read)
      .length;
  }

  markNotificationsAsRead(userId: string): void {
    this.notifications.forEach((notification, id) => {
      if (notification.recipient_id === userId && !notification.is_read) {
        this.notifications.set(id, { ...notification, is_read: true });
      }
    });
  }

  // User operations
  findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  // Business Profile operations
  getBusinessProfileByUserId(userId: string): BusinessProfile | undefined {
    return Array.from(this.businessProfiles.values()).find(bp => bp.user_id === userId);
  }

  getBusinessProfileById(id: string): BusinessProfile | undefined {
    return this.businessProfiles.get(id);
  }

  updateBusinessProfile(id: string, updates: Partial<BusinessProfile>): BusinessProfile | undefined {
    const profile = this.businessProfiles.get(id);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates };
    this.businessProfiles.set(id, updated);
    return updated;
  }

  updateBusinessPaymentMethod(businessId: string, token: string): BusinessProfile | undefined {
    const profile = this.businessProfiles.get(businessId);
    if (!profile) return undefined;
    const updated = { ...profile, default_payment_method: token };
    this.businessProfiles.set(businessId, updated);
    return updated;
  }

  saveBusinessPaymentMethod(businessProfileId: string, token: string, last4: string): BusinessProfile | undefined {
    const profile = this.businessProfiles.get(businessProfileId);
    if (!profile) return undefined;
    const updated = { ...profile, default_payment_method: token, payment_last4: last4 };
    this.businessProfiles.set(businessProfileId, updated);
    return updated;
  }

  // Worker Profile operations
  getWorkerProfileByUserId(userId: string): WorkerProfile | undefined {
    return Array.from(this.workerProfiles.values()).find(wp => wp.user_id === userId);
  }

  getWorkerProfileById(id: string): WorkerProfile | undefined {
    return this.workerProfiles.get(id);
  }

  updateWorkerProfile(id: string, updates: Partial<WorkerProfile>): WorkerProfile | undefined {
    const profile = this.workerProfiles.get(id);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates };
    this.workerProfiles.set(id, updated);
    return updated;
  }

  updateWorkerStripeStatus(workerId: string, status: boolean): WorkerProfile | undefined {
    const profile = Array.from(this.workerProfiles.values()).find(wp => wp.user_id === workerId);
    if (!profile) return undefined;
    const updated = { ...profile, stripe_account_active: status };
    this.workerProfiles.set(profile.id, updated);
    return updated;
  }

  activateWorkerStripe(workerProfileId: string): WorkerProfile | undefined {
    const profile = this.workerProfiles.get(workerProfileId);
    if (!profile) return undefined;
    const updated = { ...profile, stripe_account_active: true };
    this.workerProfiles.set(workerProfileId, updated);
    return updated;
  }

  // Shift operations
  createShift(data: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Shift {
    const now = new Date().toISOString();
    const shift: Shift = {
      ...data,
      id: this.generateId('shift'),
      created_at: now,
      updated_at: now,
    };
    this.shifts.set(shift.id, shift);

    // TRIGGER 1: Notify all workers about new gig
    const workers = Array.from(this.users.values()).filter(u => u.role === 'worker');
    workers.forEach(worker => {
      this.createNotification(
        worker.id,
        `New Gig Alert: A business is looking for a ${shift.title}!`
      );
    });

    return shift;
  }

  getShiftsByBusinessId(businessId: string): Shift[] {
    return Array.from(this.shifts.values()).filter(s => s.business_id === businessId);
  }

  getShiftsByPosterId(userId: string): Shift[] {
    return Array.from(this.shifts.values()).filter(s => s.posted_by === userId);
  }

  getOpenShifts(): Shift[] {
    return Array.from(this.shifts.values()).filter(s => s.status === 'open');
  }

  getShiftById(id: string): Shift | undefined {
    return this.shifts.get(id);
  }

  getAllShifts(): Shift[] {
    return Array.from(this.shifts.values());
  }

  updateShift(id: string, updates: Partial<Shift>): Shift | undefined {
    const shift = this.shifts.get(id);
    if (!shift) return undefined;
    const updated = { ...shift, ...updates, updated_at: new Date().toISOString() };
    this.shifts.set(id, updated);
    return updated;
  }

  claimShift(shiftId: string, workerId: string): Shift | undefined {
    const shift = this.shifts.get(shiftId);
    if (!shift || shift.status !== 'open') return undefined;
    const updated: Shift = {
      ...shift,
      worker_id: workerId,
      status: 'assigned',
      slots_filled: shift.slots_filled + 1,
      updated_at: new Date().toISOString(),
    };
    this.shifts.set(shiftId, updated);

    // TRIGGER 2: Notify business owner that shift was claimed
    this.createNotification(
      shift.posted_by,
      `Shift Filled! A worker has claimed your ${shift.title} slot.`
    );

    return updated;
  }

  releaseFunds(shiftId: string): Shift | undefined {
    const shift = this.shifts.get(shiftId);
    if (!shift || shift.status !== 'completed') return undefined;
    const updated: Shift = {
      ...shift,
      status: 'paid',
      updated_at: new Date().toISOString(),
    };
    this.shifts.set(shiftId, updated);
    return updated;
  }

  getShiftsByWorkerId(workerId: string): Shift[] {
    return Array.from(this.shifts.values()).filter(s => s.worker_id === workerId);
  }

  getAssignedShiftsByWorkerId(workerId: string): Shift[] {
    return Array.from(this.shifts.values()).filter(s => s.worker_id === workerId && s.status === 'assigned');
  }

  getPaidShiftsByWorkerId(workerId: string): Shift[] {
    return Array.from(this.shifts.values()).filter(s => s.worker_id === workerId && s.status === 'paid');
  }

  getCompletedShiftsByWorkerId(workerId: string): Shift[] {
    return Array.from(this.shifts.values()).filter(s => s.worker_id === workerId && s.status === 'completed');
  }

  getWorkerEarnings(workerId: string): WorkerEarningsResult {
    const paidShifts = this.getPaidShiftsByWorkerId(workerId);
    const completedShifts = this.getCompletedShiftsByWorkerId(workerId);
    const allEarningShifts = [...completedShifts, ...paidShifts];

    const calcPay = (shift: Shift): number => {
      const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60);
      return shift.hourly_rate * hours;
    };

    const totalEarned = allEarningShifts.reduce((sum, shift) => sum + calcPay(shift), 0);
    const pendingPayouts = completedShifts.reduce((sum, shift) => sum + calcPay(shift), 0);

    const history: ShiftWithBusiness[] = allEarningShifts
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .map(shift => {
        const business = this.businessProfiles.get(shift.business_id);
        const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
        return {
          ...shift,
          company_name: business?.company_name ?? 'Unknown Company',
          estimated_total_pay: hours * shift.hourly_rate,
        };
      });

    return { totalEarned, pendingPayouts, history };
  }

  getShiftsByEmployerAndStatus(employerUserId: string, status: string): Shift[] {
    return Array.from(this.shifts.values()).filter(
      s => s.posted_by === employerUserId && s.status === status
    );
  }

  getShiftsByEmployerAndStatusWithBusiness(employerUserId: string, status: string): ShiftWithBusiness[] {
    return this.getShiftsByEmployerAndStatus(employerUserId, status).map(shift => {
      const business = this.businessProfiles.get(shift.business_id);
      const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
      return {
        ...shift,
        company_name: business?.company_name ?? 'Unknown Company',
        estimated_total_pay: hours * shift.hourly_rate,
      };
    });
  }

  // Relational queries
  getShiftsWithBusiness(): (Shift & { business: BusinessProfile })[] {
    return Array.from(this.shifts.values()).map(shift => {
      const business = this.businessProfiles.get(shift.business_id)!;
      return { ...shift, business };
    });
  }

  getOpenShiftsWithBusiness(): ShiftWithBusiness[] {
    return this.getOpenShifts().map(shift => {
      const business = this.businessProfiles.get(shift.business_id);
      const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
      return {
        ...shift,
        company_name: business?.company_name ?? 'Unknown Company',
        estimated_total_pay: hours * shift.hourly_rate,
      };
    });
  }

  getAssignedShiftsWithBusiness(workerId: string): ShiftWithBusiness[] {
    return this.getAssignedShiftsByWorkerId(workerId).map(shift => {
      const business = this.businessProfiles.get(shift.business_id);
      const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
      return {
        ...shift,
        company_name: business?.company_name ?? 'Unknown Company',
        estimated_total_pay: hours * shift.hourly_rate,
      };
    });
  }

  getShiftWithBusiness(shiftId: string): ShiftWithBusiness | undefined {
    const shift = this.shifts.get(shiftId);
    if (!shift) return undefined;
    const business = this.businessProfiles.get(shift.business_id);
    const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
    return {
      ...shift,
      company_name: business?.company_name ?? 'Unknown Company',
      estimated_total_pay: hours * shift.hourly_rate,
    };
  }

  reset() {
    this.users.clear();
    this.businessProfiles.clear();
    this.workerProfiles.clear();
    this.shifts.clear();
    this.notifications.clear();
    this.idCounter = 100;
    this.seed();
  }
}

// Singleton instance
export const db = new MockDatabase();
