import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { onboardWorker } from '../services/stripe';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';

export function WorkerEarnings() {
  const { currentUser, workerProfile, refreshProfiles } = useAuthStore();
  const [onboarding, setOnboarding] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [_, setTick] = useState(0);

  const earnings = currentUser
    ? db.getWorkerEarnings(currentUser.id)
    : { totalEarned: 0, pendingPayouts: 0, history: [] };

  const stripeActive = workerProfile?.stripe_account_active ?? false;

  const handleSetupPayouts = async () => {
    if (!currentUser) return;
    setOnboarding(true);
    await onboardWorker(currentUser.id);
    refreshProfiles();
    setOnboarding(false);
  };

  const handleReleaseFunds = async (shiftId: string) => {
    setReleasingId(shiftId);
    await new Promise(resolve => setTimeout(resolve, 500));
    db.releaseFunds(shiftId);
    setReleasingId(null);
    setTick(t => t + 1);
  };

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      
      <div className="px-4 pt-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Wallet & Earnings</h2>
          <p className="text-sm text-surface-400 mt-0.5">Track your income and payouts</p>
        </div>

        {/* Stripe Payout Setup Card */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-4">
          {stripeActive ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                <span className="text-lg">💳</span>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#22C55E]">
                  ✓ Payouts Active via Stripe
                </span>
                <p className="text-xs text-surface-400 mt-0.5">Direct deposits enabled to your bank</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-lg">🏦</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Direct Payouts</p>
                  <p className="text-xs text-surface-400">Connect your bank for instant payouts</p>
                </div>
              </div>
              <button
                onClick={handleSetupPayouts}
                disabled={onboarding}
                className="px-4 py-2.5 bg-primary-500 text-surface-900 font-bold text-xs rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all"
              >
                {onboarding ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Setting up…
                  </span>
                ) : (
                  'Setup Direct Payouts'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Total Lifetime Earnings Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 mb-4 shadow-glow">
          <p className="text-surface-900/70 text-xs font-semibold uppercase tracking-wide mb-1">Total Lifetime Earnings</p>
          <p className="text-4xl font-bold text-surface-900">${earnings.totalEarned.toFixed(2)}</p>
          <p className="text-surface-900/70 text-sm mt-1">
            From {earnings.history.length} gig{earnings.history.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Pending Payouts Card */}
        {earnings.pendingPayouts > 0 && (
          <div className="bg-surface-800 rounded-2xl p-4 mb-5 border border-primary-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-1">Pending Payouts</p>
                <p className="text-2xl font-bold text-white">${earnings.pendingPayouts.toFixed(2)}</p>
                <p className="text-xs text-surface-400 mt-0.5">
                  {earnings.history.filter(s => s.status === 'completed').length} shift{earnings.history.filter(s => s.status === 'completed').length !== 1 ? 's' : ''} awaiting payment
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Ledger */}
        <h3 className="font-bold text-white text-sm mb-3">Earnings Ledger</h3>
        
        {earnings.history.length === 0 ? (
          <EmptyState
            icon="💰"
            title="No earnings yet"
            description="Complete gigs to start earning. Your earnings ledger will appear here."
          />
        ) : (
          <div className="space-y-2">
            {earnings.history.map(shift => {
              const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60);
              const earned = shift.hourly_rate * hours;
              const isPending = shift.status === 'completed';
              return (
                <div key={shift.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-surface-900 text-sm">{shift.title}</h4>
                      <p className="text-xs text-primary-600 font-medium mt-0.5">{shift.company_name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {new Date(shift.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {hours}h @ ${shift.hourly_rate}/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isPending ? 'text-primary-500' : 'text-success-600'}`}>
                        ${earned.toFixed(0)}
                      </p>
                      {isPending ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                            COMPLETED / PENDING PAYOUT
                          </span>
                          <button
                            onClick={() => handleReleaseFunds(shift.id)}
                            disabled={releasingId === shift.id}
                            className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 hover:bg-[#22C55E]/20 px-2.5 py-1 rounded-full transition-all disabled:opacity-50"
                          >
                            {releasingId === shift.id ? 'Releasing…' : 'Release Funds'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-success-600 bg-success-50 px-2 py-0.5 rounded-full">
                          PAID
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
