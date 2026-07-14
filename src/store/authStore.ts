import { create } from 'zustand';
import { User, BusinessProfile, WorkerProfile } from '../types';
import { db } from './database';

interface AuthStore {
  currentUser: User | null;
  businessProfile: BusinessProfile | null;
  workerProfile: WorkerProfile | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  clearError: () => void;
  refreshProfiles: () => void;
  updateBusinessProfile: (updates: Partial<BusinessProfile>) => void;
  updateWorkerProfile: (updates: Partial<WorkerProfile>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  businessProfile: null,
  workerProfile: null,
  isAuthenticated: false,
  error: null,

  login: (email: string, _password: string) => {
    const user = db.findUserByEmail(email);
    if (!user) {
      set({ error: 'No account found with this email address.' });
      return false;
    }

    if (_password.length < 1) {
      set({ error: 'Please enter your password.' });
      return false;
    }

    let businessProfile: BusinessProfile | null = null;
    let workerProfile: WorkerProfile | null = null;

    if (user.role === 'business') {
      businessProfile = db.getBusinessProfileByUserId(user.id) || null;
    } else {
      workerProfile = db.getWorkerProfileByUserId(user.id) || null;
    }

    set({
      currentUser: user,
      businessProfile,
      workerProfile,
      isAuthenticated: true,
      error: null,
    });

    return true;
  },

  logout: () => {
    set({
      currentUser: null,
      businessProfile: null,
      workerProfile: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  refreshProfiles: () => {
    const { currentUser } = get();
    if (!currentUser) return;
    if (currentUser.role === 'business') {
      const bp = db.getBusinessProfileByUserId(currentUser.id) || null;
      set({ businessProfile: bp });
    } else {
      const wp = db.getWorkerProfileByUserId(currentUser.id) || null;
      set({ workerProfile: wp });
    }
  },

  updateBusinessProfile: (updates: Partial<BusinessProfile>) => {
    const { businessProfile } = get();
    if (!businessProfile) return;
    const updated = db.updateBusinessProfile(businessProfile.id, updates);
    if (updated) {
      set({ businessProfile: updated });
    }
  },

  updateWorkerProfile: (updates: Partial<WorkerProfile>) => {
    const { workerProfile } = get();
    if (!workerProfile) return;
    const updated = db.updateWorkerProfile(workerProfile.id, updates);
    if (updated) {
      set({ workerProfile: updated });
    }
  },
}));
