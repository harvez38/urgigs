import { create } from 'zustand';

export type BannerType = 'error' | 'success' | 'info';

interface BannerMessage {
  id: string;
  type: BannerType;
  message: string;
  timestamp: number;
}

interface NotificationBannerStore {
  banners: BannerMessage[];
  showBanner: (type: BannerType, message: string) => void;
  dismissBanner: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationBanner = create<NotificationBannerStore>((set) => ({
  banners: [],
  showBanner: (type, message) => {
    const id = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      banners: [...state.banners, { id, type, message, timestamp: Date.now() }],
    }));
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      set((state) => ({
        banners: state.banners.filter((b) => b.id !== id),
      }));
    }, 6000);
  },
  dismissBanner: (id) =>
    set((state) => ({
      banners: state.banners.filter((b) => b.id !== id),
    })),
  clearAll: () => set({ banners: [] }),
}));
