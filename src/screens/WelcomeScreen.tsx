import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../store/authStore';

type AuthMode = 'welcome' | 'login';

export function WelcomeScreen() {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'business' | 'worker' | null>(null);
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = login(email, password);
    if (success) {
      const user = useAuthStore.getState().currentUser;
      if (user?.role === 'business') {
        navigate('/employer');
      } else {
        navigate('/worker');
      }
    }
  };

  const handleRoleSelect = (role: 'business' | 'worker') => {
    setSelectedRole(role);
    if (role === 'business') {
      setEmail('employer@urgigs.com');
    } else {
      setEmail('worker@urgigs.com');
    }
    setMode('login');
  };

  if (mode === 'welcome') {
    return (
      <div className="screen-container flex flex-col bg-surface-900">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
          <div className="mb-10">
            <Logo size="lg" />
          </div>
          
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Get started
            </h2>
            <p className="text-center text-surface-400 text-sm mb-8">
              Choose how you want to use UrGigs
            </p>

            {/* Role Selection Cards */}
            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect('business')}
                className="w-full bg-surface-800 rounded-2xl p-5 border border-surface-700 hover:border-primary-500 transition-all duration-200 text-left active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">\ud83c\udfe2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">I want to Hire</h3>
                    <p className="text-xs text-surface-400 mt-0.5">Post shifts and find reliable workers</p>
                  </div>
                  <svg className="w-5 h-5 text-surface-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('worker')}
                className="w-full bg-surface-800 rounded-2xl p-5 border border-surface-700 hover:border-primary-500 transition-all duration-200 text-left active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">\ud83d\udcbc</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">I want to Work</h3>
                    <p className="text-xs text-surface-400 mt-0.5">Find gigs that match your skills</p>
                  </div>
                  <svg className="w-5 h-5 text-surface-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 text-center">
          <p className="text-xs text-surface-500">
            Already have an account?{' '}
            <button onClick={() => setMode('login')} className="text-primary-500 font-semibold">
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container flex flex-col bg-surface-900">
      <div className="flex-1 flex flex-col px-6 pt-12">
        {/* Back button */}
        <button
          onClick={() => { setMode('welcome'); clearError(); }}
          className="flex items-center gap-2 text-surface-400 mb-8 -ml-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="mb-8">
          <Logo size="md" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          Sign in {selectedRole === 'business' ? 'as Employer' : selectedRole === 'worker' ? 'as Worker' : ''}
        </h2>
        <p className="text-sm text-surface-400 mb-6">
          Enter your credentials to continue
        </p>

        {error && (
          <div className="bg-alert-500/10 border border-alert-500/30 text-alert-500 text-sm font-medium px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input-field"
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2">
            Sign In
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 p-4 bg-surface-800 rounded-xl border border-surface-700">
          <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-2">Demo Accounts</p>
          <div className="space-y-1.5 text-xs text-surface-300">
            <p><span className="font-medium text-primary-500">Employer:</span> employer@urgigs.com</p>
            <p><span className="font-medium text-primary-500">Worker:</span> worker@urgigs.com</p>
            <p className="text-surface-500 italic">Any password works for demo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
