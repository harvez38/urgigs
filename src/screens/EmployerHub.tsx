import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';
import { ShiftCard } from '../components/ShiftCard';
import { PostShiftModal } from '../components/PostShiftModal';
import { RatingModal } from '../components/RatingModal';
import { Shift } from '../types';

type GigView = 'active' | 'past' | 'manage';

export function EmployerHub() {
  const { currentUser, businessProfile } = useAuthStore();
  const [gigView, setGigView] = useState<GigView>('active');
  const [showPostModal, setShowPostModal] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>(() =>
    currentUser ? db.getShiftsByPosterId(currentUser.id) : []
  );

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingShift, setRatingShift] = useState<Shift | null>(null);

  const unreviewedShifts = currentUser
    ? db.getUnreviewedPaidShifts(currentUser.id, 'business')
    : [];

  const activeGigs = shifts.filter(s => ['open', 'assigned', 'in_progress'].includes(s.status));
  const pastGigs = shifts.filter(s => ['completed', 'paid', 'cancelled', 'disputed'].includes(s.status));
  const manageShifts = shifts.filter(s => s.status === 'assigned');

  const displayedShifts = gigView === 'active' ? activeGigs : gigView === 'past' ? pastGigs : manageShifts;

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
      check_in_time: null,
      check_out_time: null,
      actual_lat: null,
      actual_lng: null,
    });

    setShifts(prev => [newShift, ...prev]);
    setShowPostModal(false);
    setGigView('active');
  };

  const handleApproveForPayment = (shiftId: string) => {
    const updated = db.updateShift(shiftId, { status: 'completed' });
    if (updated) {
      setShifts(currentUser ? db.getShiftsByPosterId(currentUser.id) : []);
    }
  };

  const handleDispute = (shiftId: string) => {
    db.disputeShift(shiftId);
    setShifts(currentUser ? db.getShiftsByPosterId(currentUser.id) : []);
  };

  const handleOpenRating = (shift: Shift) => {
    setRatingShift(shift);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (rating: number, feedback: string) => {
    if (!currentUser || !ratingShift || !ratingShift.worker_id) return;
    db.addReview({
      shift_id: ratingShift.id,
      reviewer_id: currentUser.id,
      reviewee_id: ratingShift.worker_id,
      rating_stars: rating,
      feedback_text: feedback,
    });
    setRatingShift(null);
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
                {businessProfile.company_name} · {businessProfile.city}, {businessProfile.state}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-primary-500 text-surface-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary-400 active:scale-95 transition-all"
          >
            + Post a New Shift
          </button>
        </div>

        {/* Pending Reviews Banner */}
        {unreviewedShifts.length > 0 && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 mb-5" data-testid="pending-reviews-banner">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <p className="text-sm font-bold text-primary-500">
                {unreviewedShifts.length} shift{unreviewedShifts.length > 1 ? 's' : ''} awaiting your review
              </p>
            </div>
            <div className="space-y-2">
              {unreviewedShifts.slice(0, 3).map(shift => (
                <button
                  key={shift.id}
                  onClick={() => handleOpenRating(shift)}
                  className="w-full flex items-center justify-between bg-surface-800 rounded-lg px-3 py-2 hover:bg-surface-700 transition-all"
                >
                  <span className="text-xs text-white font-medium">{shift.title}</span>
                  <span className="text-[10px] font-semibold text-primary-500">Rate →</span>
                </button>
              ))}
            </div>
          </div>
        )}

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

        {/* Active / Past / Manage Toggle */}
        <div className="flex gap-1 bg-surface-800 p-1 rounded-xl mb-5 border border-surface-700">
          <button
            onClick={() => setGigView('active')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold transition-all duration-150 ${
              gigView === 'active'
                ? 'bg-primary-500 text-surface-900 shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Active ({activeGigs.length})
          </button>
          <button
            onClick={() => setGigView('past')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold transition-all duration-150 ${
              gigView === 'past'
                ? 'bg-primary-500 text-surface-900 shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Past ({pastGigs.length})
          </button>
          <button
            onClick={() => setGigView('manage')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold transition-all duration-150 ${
              gigView === 'manage'
                ? 'bg-primary-500 text-surface-900 shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Manage Shifts ({manageShifts.length})
          </button>
        </div>

        {/* Shifts List */}
        {displayedShifts.length === 0 ? (
          <EmptyState
            icon={gigView === 'active' ? '📋' : gigView === 'past' ? '📦' : '✅'}
            title={
              gigView === 'active'
                ? 'No active open postings'
                : gigView === 'past'
                ? 'No past gigs'
                : 'No shifts to manage'
            }
            description={
              gigView === 'active'
                ? 'Post your first shift to start finding reliable workers.'
                : gigView === 'past'
                ? 'Completed and cancelled gigs will appear here.'
                : 'Assigned shifts awaiting verification will appear here.'
            }
            actionLabel={gigView === 'active' ? 'Post a New Shift' : undefined}
            onAction={gigView === 'active' ? () => setShowPostModal(true) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {displayedShifts.map(shift => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                variant="employer"
                onApprovePayment={gigView === 'manage' ? handleApproveForPayment : undefined}
                onDispute={handleDispute}
              />
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
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => { setShowRatingModal(false); setRatingShift(null); }}
        onSubmit={handleSubmitRating}
        shiftTitle={ratingShift?.title || ''}
        revieweeName={ratingShift?.worker_id ? (db.getUserById(ratingShift.worker_id)?.full_name || 'Worker') : 'Worker'}
      />
    </div>
  );
}
