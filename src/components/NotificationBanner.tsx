import { useNotificationBanner } from '../store/notificationBanner';

export function NotificationBanner() {
  const { banners, dismissBanner } = useNotificationBanner();

  if (banners.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 p-3 pointer-events-none">
      {banners.map((banner) => {
        const bgColor =
          banner.type === 'error'
            ? 'bg-red-600/95'
            : banner.type === 'success'
            ? 'bg-green-600/95'
            : 'bg-blue-600/95';

        const icon =
          banner.type === 'error' ? '\u26a0\ufe0f' : banner.type === 'success' ? '\u2713' : '\u2139\ufe0f';

        return (
          <div
            key={banner.id}
            className={`${bgColor} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm w-full flex items-center gap-2 pointer-events-auto animate-slide-down`}
          >
            <span>{icon}</span>
            <span className="flex-1">{banner.message}</span>
            <button
              onClick={() => dismissBanner(banner.id)}
              className="text-white/70 hover:text-white ml-2 text-lg leading-none"
            >
              \u00d7
            </button>
          </div>
        );
      })}
    </div>
  );
}
