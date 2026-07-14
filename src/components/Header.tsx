import { useAuthStore } from '../store/authStore';
import { Logo } from './Logo';

export function Header() {
  const { currentUser, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-xl border-b border-surface-800">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">{currentUser?.full_name}</p>
            <p className="text-[10px] text-surface-400 capitalize">{currentUser?.role === 'business' ? 'Employer' : 'Worker'}</p>
          </div>
          <button
            onClick={logout}
            className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:bg-surface-700 hover:text-white transition-colors"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
