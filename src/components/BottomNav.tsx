import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const businessNav: NavItem[] = [
    { path: '/employer', label: 'Shifts', icon: '\ud83d\udccb' },
    { path: '/employer/post', label: 'Post', icon: '\u2795' },
    { path: '/employer/profile', label: 'Profile', icon: '\ud83d\udc64' },
  ];

  const workerNav: NavItem[] = [
    { path: '/worker', label: 'Find Gigs', icon: '\ud83d\udd0d' },
    { path: '/worker/earnings', label: 'Earnings', icon: '\ud83d\udcb0' },
    { path: '/worker/profile', label: 'Profile', icon: '\ud83d\udc64' },
  ];

  const navItems = currentUser?.role === 'business' ? businessNav : workerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-900 border-t border-surface-800 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-primary-500'
                  : 'text-surface-500 active:text-surface-300'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[11px] font-semibold ${isActive ? 'text-primary-500' : 'text-surface-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
