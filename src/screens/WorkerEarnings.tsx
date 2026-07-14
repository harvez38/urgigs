import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';

export function WorkerEarnings() {
  const { currentUser } = useAuthStore();

  const earnings = currentUser ? db.getWorkerEarnings(currentUser.id) : { total: 0, shifts: [] };
  const assignedShifts = currentUser ? db.getShiftsByWorkerId(currentUser.id).filter(s => s.status === 'assigned' || s.status === 'in_progress') : [];

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      
      <div className="px-4 pt-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">My Earnings</h2>
          <p className="text-sm text-surface-400 mt-0.5">Track your income from completed gigs</p>
        </div>

        {/* Earnings Summary Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 mb-5 shadow-glow">
          <p className="text-surface-900/70 text-xs font-semibold uppercase tracking-wide mb-1">Total Earned</p>
          <p className="text-4xl font-bold text-surface-900">${earnings.total.toFixed(2)}</p>
          <p className="text-surface-900/70 text-sm mt-1">
            From {earnings.shifts.length} paid shift{earnings.shifts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Pending Work */}
        {assignedShifts.length > 0 && (
          <div className="bg-surface-800 rounded-2xl p-4 mb-5 border border-surface-700">
            <h3 className="text-sm font-bold text-white mb-2">Upcoming Work</h3>
            <p className="text-xs text-surface-400">{assignedShifts.length} shift{assignedShifts.length !== 1 ? 's' : ''} assigned</p>
            <div className="mt-3 space-y-2">
              {assignedShifts.map(shift => {
                const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60);
                return (
                  <div key={shift.id} className="flex items-center justify-between py-2 border-t border-surface-700">
                    <div>
                      <p className="text-sm font-medium text-white">{shift.title}</p>
                      <p className="text-xs text-surface-400">
                        {new Date(shift.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary-500">${(shift.hourly_rate * hours).toFixed(0)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Paid Shifts History */}
        <h3 className="font-bold text-white text-sm mb-3">Payment History</h3>
        
        {earnings.shifts.length === 0 ? (
          <EmptyState
            icon="\ud83d\udcb0"
            title="No earnings yet"
            description="Complete gigs to start earning. Your payment history will appear here."
          />
        ) : (
          <div className="space-y-2">
            {earnings.shifts.map(shift => {
              const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60);
              const earned = shift.hourly_rate * hours;
              return (
                <div key={shift.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-surface-900 text-sm">{shift.title}</h4>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {new Date(shift.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} \u00b7 {hours}h @ ${shift.hourly_rate}/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success-600">${earned.toFixed(0)}</p>
                      <span className="text-[10px] font-semibold text-success-600 bg-success-50 px-2 py-0.5 rounded-full">PAID</span>
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
