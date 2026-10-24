import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, BusinessProfile, WorkerProfile } from '../types';
import { db } from './database';

/** Build the signed-in state for a user, loading their profile from the database. */
function sessionFor(user: User) {
  return {
    currentUser: user,
    businessProfile: user.role === 'business' ? db.getBusinessProfileByUserId(user.id) || null : null,
    workerProfile: user.role === 'worker' ? db.getWorkerProfileByUserId(user.id) || null : null,
    isAuthenticated: true,
    error: null,
  };
}

// Only the signed-in user's id is saved, so a page refresh keeps you logged in.
// Profiles are reloaded from the database on startup.
interface PersistedAuth {
  currentUserId?: string | null;
}

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

export const useAuthStore = create<AuthStore>()(persist((set, get) => ({
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

    set(sessionFor(user));

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
}), {
  name: 'urgigs-auth',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state): PersistedAuth => ({ currentUserId: state.currentUser?.id ?? null }),
  merge: (persisted, current) => {
    const id = (persisted as PersistedAuth | undefined)?.currentUserId;
    const user = id ? db.getUserById(id) : undefined;
    return user ? { ...current, ...sessionFor(user) } : current;
  },
}));
