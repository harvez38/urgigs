import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';
import { ShiftCard } from '../components/ShiftCard';
import { PostShiftModal } from '../components/PostShiftModal';
import { Shift } from '../types';

type GigView = 'active' | 'past';

export function EmployerHub() {
  const { currentUser, businessProfile } = useAuthStore();
  const [gigView, setGigView] = useState<GigView>('active');
  const [showPostModal, setShowPostModal] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>(() =>
    currentUser ? db.getShiftsByPosterId(currentUser.id) : []
  );

  const activeGigs = shifts.filter(s => ['open', 'assigned', 'in_progress'].includes(s.status));
  const pastGigs = shifts.filter(s => ['completed', 'paid', 'cancelled'].includes(s.status));
  const displayedShifts = gigView === 'active' ? activeGigs : pastGigs;

  const handlePostShift = (data: { role_title: string; description: string; hourly_rate: string; start_time: string; end_time: string }) => {
    if (!currentUser || !businessProfile) return;

    const newShift = db.createShift({
      business_id: businessProfile.id,
      posted_by: currentUser.id,
      worker_id: null,
      title: data.role_title,
      description: data.description,
      category: 'General',
      hourly_rate: parseFloat(data.hourly_rate),
      start_time: new Date(data.start_time).toISOString(),
      end_time: new Date(data.end_time).toISOString(),
      location: businessProfile.address,
      city: businessProfile.city,
      state: businessProfile.state,
      slots_total: 1,
      slots_filled: 0,
      status: 'open',
      requirements: [],
    });

    setShifts(prev => [newShift, ...prev]);
    setShowPostModal(false);
    setGigView('active');
  };

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      
      <div className="px-4 pt-5">
        {/* Welcome Section */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Employer Hub</h2>
            {businessProfile && (
              <p className="text-sm text-surface-400 mt-0.5">
                {businessProfile.company_name} \u00b7 {businessProfile.city}, {businessProfile.state}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-primary-500 text-surface-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary-400 active:scale-95 transition-all"
          >
            + Post Shift
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-surface-800 rounded-xl p-3 text-center border border-surface-700">
            <p className="text-xl font-bold text-primary-500">{shifts.length}</p>
            <p className="text-[11px] text-surface-400 font-medium">Total</p>
          </div>
          <div className="bg-surface-800 rounded-xl p-3 text-center border border-surface-700">
            <p className="text-xl font-bold text-success-500">{activeGigs.length}</p>
            <p className="text-[11px] text-surface-400 font-medium">Active</p>
          </div>
          <div className="bg-surface-800 rounded-xl p-3 text-center border border-surface-700">
            <p className="text-xl font-bold text-surface-400">{pastGigs.length}</p>
            <p className="text-[11px] text-surface-400 font-medium">Past</p>
          </div>
        </div>

        {/* Active / Past Toggle */}
        <div className="flex gap-1 bg-surface-800 p-1 rounded-xl mb-5 border border-surface-700">
          <button
            onClick={() => setGigView('active')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-150 ${
              gigView === 'active'
                ? 'bg-primary-500 text-surface-900 shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Active Gigs ({activeGigs.length})
          </button>
          <button
            onClick={() => setGigView('past')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-150 ${
              gigView === 'past'
                ? 'bg-primary-500 text-surface-900 shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Past Gigs ({pastGigs.length})
          </button>
        </div>

        {/* Shifts List */}
        {displayedShifts.length === 0 ? (
          <EmptyState
            icon={gigView === 'active' ? '\ud83d\udccb' : '\ud83d\udce6'}
            title={gigView === 'active' ? 'No active gigs' : 'No past gigs'}
            description={
              gigView === 'active'
                ? 'Post your first shift and start finding reliable workers.'
                : 'Completed and cancelled gigs will appear here.'
            }
            actionLabel={gigView === 'active' ? 'Post a Shift' : undefined}
            onAction={gigView === 'active' ? () => setShowPostModal(true) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {displayedShifts.map(shift => (
              <ShiftCard key={shift.id} shift={shift} variant="employer" />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      <PostShiftModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSubmit={handlePostShift}
      />
    </div>
  );
}
