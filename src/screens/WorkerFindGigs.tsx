import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { db, ShiftWithBusiness } from '../store/database';
import { Shift } from '../types';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';
import { ShiftCard } from '../components/ShiftCard';
import { RatingModal } from '../components/RatingModal';

type TabView = 'find' | 'schedule';
type CategoryFilter = 'all' | string;

export function WorkerFindGigs() {
  const { currentUser, workerProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabView>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [selectedShift, setSelectedShift] = useState<ShiftWithBusiness | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [displayShifts, setDisplayShifts] = useState<ShiftWithBusiness[]>(() => db.getOpenShiftsWithBusiness());

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingShift, setRatingShift] = useState<Shift | null>(null);
  const unreviewedShifts = currentUser ? db.getUnreviewedPaidShifts(currentUser.id, "worker") : [];

  const handleOpenRating = (shift: Shift) => {
    setRatingShift(shift);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (rating: number, feedback: string) => {
    if (!currentUser || !ratingShift) return;
    db.addReview({
      shift_id: ratingShift.id,
      reviewer_id: currentUser.id,
      reviewee_id: ratingShift.posted_by,
      rating_stars: rating,
      feedback_text: feedback,
    });
    setRatingShift(null);
  };

  const [scheduleKey, setScheduleKey] = useState(0);
  void scheduleKey;
  const myShifts = currentUser ? [
    ...db.getAssignedShiftsWithBusiness(currentUser.id),
    ...db.getShiftsByWorkerId(currentUser.id).filter(s => s.status === "in_progress").map(s => {
      const biz = db.getBusinessProfileById(s.business_id);
      const hours = (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3600000;
      return { ...s, company_name: biz?.company_name ?? "Unknown Company", estimated_total_pay: hours * s.hourly_rate };
    })
  ] : [];

  const categories = ['all', ...new Set(displayShifts.map(s => s.category))];

  const filteredShifts = displayShifts.filter(shift => {
    const matchesCategory = activeCategory === 'all' || shift.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      shift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleClaim = useCallback((shiftId: string) => {
    if (!currentUser) return;
    setClaimError(null);
    const currentShift = db.getShiftById(shiftId);
    if (!currentShift || currentShift.status !== 'open') {
      setClaimError('This shift is no longer available.');
      return;
    }
    const updated = db.claimShift(shiftId, currentUser.id);
    if (updated) {
      setClaimedIds(prev => new Set(prev).add(shiftId));
      setDisplayShifts(prev => prev.map(s =>
        s.id === shiftId ? { ...s, status: 'assigned' as const, worker_id: currentUser.id } : s
      ));
      if (selectedShift?.id === shiftId) {
        setSelectedShift(prev => prev ? { ...prev, status: 'assigned' as const, worker_id: currentUser.id } : null);
      }
    } else {
      setClaimError('Unable to claim this shift. It may have already been taken.');
    }
  }, [currentUser, selectedShift]);

  const handleDispute = useCallback((shiftId: string) => {
    db.disputeShift(shiftId);
    setDisplayShifts(db.getOpenShiftsWithBusiness());
    if (selectedShift?.id === shiftId) {
      setSelectedShift(null);
    }
  }, [selectedShift]);

  const handleCardClick = useCallback((shiftId: string) => {
    const shiftWithBiz = db.getShiftWithBusiness(shiftId);
    if (shiftWithBiz) {
      setSelectedShift(shiftWithBiz);
      setClaimError(null);
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedShift(null);
    setClaimError(null);
  }, []);

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      <div className="px-4 pt-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">
            {activeTab === 'find' ? 'Find Gigs' : 'My Schedule'}
          </h2>
          {workerProfile && (
            <p className="text-sm text-surface-400 mt-0.5">
              {workerProfile.gigs_completed} gigs completed · ⭐ {workerProfile.rating}
            </p>
          )}
        </div>

        {unreviewedShifts.length > 0 && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 mb-4" data-testid="worker-pending-reviews">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <p className="text-sm font-bold text-primary-500">
                Rate {unreviewedShifts.length} completed shift{unreviewedShifts.length > 1 ? "s" : ""}
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

        <div className="flex bg-surface-800 rounded-xl p-1 mb-4 border border-surface-700">
          <button
            onClick={() => setActiveTab('find')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'find'
                ? 'bg-primary-500 text-surface-900 shadow-sm'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            Find Gigs
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'schedule'
                ? 'bg-primary-500 text-surface-900 shadow-sm'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            My Schedule
          </button>
        </div>

        {activeTab === 'find' && (
          <>
            <div className="relative mb-4">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gigs by title, company, location..."
                className="input-field pl-10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    activeCategory === cat
                      ? 'bg-primary-500 text-surface-900 shadow-sm'
                      : 'bg-surface-800 text-surface-400 border border-surface-700 hover:border-primary-500/50'
                  }`}
                >
                  {cat === 'all' ? 'All Gigs' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">
                Available Shifts
                <span className="text-surface-500 font-normal ml-1.5">({filteredShifts.length})</span>
              </h3>
            </div>

            {filteredShifts.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No gigs found"
                description="Try adjusting your search or filters to find available shifts near you."
              />
            ) : (
              <div className="space-y-3">
                {filteredShifts.map(shift => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    variant="worker"
                    companyName={shift.company_name}
                    estimatedTotalPay={shift.estimated_total_pay}
                    onClaim={handleClaim}
                    onDispute={handleDispute}
                    onClick={handleCardClick}
                    claimed={claimedIds.has(shift.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">
                Upcoming Shifts
                <span className="text-surface-500 font-normal ml-1.5">({myShifts.length})</span>
              </h3>
            </div>

            {myShifts.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No upcoming shifts"
                description="Claim open gigs to build your schedule. Switch to 'Find Gigs' to discover opportunities."
                actionLabel="Find Gigs"
                onAction={() => setActiveTab('find')}
              />
            ) : (
              <div className="space-y-3">
                {myShifts.map(shift => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    variant="worker"
                    companyName={shift.company_name}
                    estimatedTotalPay={shift.estimated_total_pay}
                    displayBadge={shift.status === "in_progress" ? undefined : "UPCOMING"}
                    onDispute={handleDispute}
                    onClick={handleCardClick}
                    onRefresh={() => setScheduleKey(k => k + 1)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedShift && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-surface-800 rounded-t-3xl border-t border-surface-700 p-6 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-surface-600 rounded-full mx-auto mb-5" />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-700 text-surface-400 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">{selectedShift.title}</h2>
              <p className="text-sm text-primary-500 font-semibold mt-1">{selectedShift.company_name}</p>
              <p className="text-xs text-surface-400 mt-0.5">{selectedShift.category}</p>
            </div>
            <div className="mb-4">
              {selectedShift.status === 'open' && !claimedIds.has(selectedShift.id) ? (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-success-50 text-success-700 border-success-200">OPEN</span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">UPCOMING</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-700/50 rounded-xl p-3">
                <p className="text-[11px] text-surface-400 uppercase tracking-wide">Hourly Rate</p>
                <p className="text-base font-bold text-primary-500">${selectedShift.hourly_rate}/hr</p>
              </div>
              <div className="bg-surface-700/50 rounded-xl p-3">
                <p className="text-[11px] text-surface-400 uppercase tracking-wide">Est. Total Pay</p>
                <p className="text-base font-bold text-success-500">${selectedShift.estimated_total_pay.toFixed(0)}</p>
              </div>
              <div className="bg-surface-700/50 rounded-xl p-3">
                <p className="text-[11px] text-surface-400 uppercase tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-white">
                  {((new Date(selectedShift.end_time).getTime() - new Date(selectedShift.start_time).getTime()) / 3600000).toFixed(1)}h
                </p>
              </div>
              <div className="bg-surface-700/50 rounded-xl p-3">
                <p className="text-[11px] text-surface-400 uppercase tracking-wide">Location</p>
                <p className="text-sm font-semibold text-white">{selectedShift.city}, {selectedShift.state}</p>
              </div>
            </div>
            <div className="bg-surface-700/50 rounded-xl p-3 mb-4">
              <p className="text-[11px] text-surface-400 uppercase tracking-wide mb-1">Date & Time</p>
              <p className="text-sm font-semibold text-white">
                {new Date(selectedShift.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-surface-300 mt-0.5">
                {new Date(selectedShift.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – {new Date(selectedShift.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-[11px] text-surface-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-surface-300 leading-relaxed">{selectedShift.description}</p>
            </div>
            <div className="mb-4">
              <p className="text-[11px] text-surface-400 uppercase tracking-wide mb-1">Address</p>
              <p className="text-sm text-surface-300">{selectedShift.location}, {selectedShift.city}, {selectedShift.state}</p>
            </div>
            {selectedShift.requirements.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] text-surface-400 uppercase tracking-wide mb-2">Requirements & Instructions</p>
                <div className="flex flex-wrap gap-2">
                  {selectedShift.requirements.map((req, i) => (
                    <span key={i} className="text-xs font-medium bg-surface-700 text-surface-300 px-2.5 py-1 rounded-lg border border-surface-600">{req}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedShift.status === 'open' && !claimedIds.has(selectedShift.id) && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-surface-400">
                  {selectedShift.slots_total - selectedShift.slots_filled} of {selectedShift.slots_total} spots remaining
                </span>
              </div>
            )}
            {claimError && (
              <div className="mb-4 p-3 rounded-xl bg-alert-500/10 border border-alert-500/30">
                <p className="text-sm text-alert-400">{claimError}</p>
              </div>
            )}
            {selectedShift.status === 'open' && !claimedIds.has(selectedShift.id) && (
              <button
                onClick={() => handleClaim(selectedShift.id)}
                className="w-full btn-primary text-base font-bold py-4"
              >
                🎯 Claim This Shift
              </button>
            )}
            {claimedIds.has(selectedShift.id) && (
              <div className="w-full text-center py-4 bg-success-500/10 border border-success-500/30 rounded-xl">
                <span className="text-success-500 font-bold text-base">✓ Shift Claimed Successfully!</span>
              </div>
            )}
            {selectedShift.status === 'assigned' && selectedShift.worker_id === currentUser?.id && !claimedIds.has(selectedShift.id) && (
              <div className="w-full text-center py-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                <span className="text-primary-500 font-bold text-base">📅 On Your Schedule</span>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => { setShowRatingModal(false); setRatingShift(null); }}
        onSubmit={handleSubmitRating}
        shiftTitle={ratingShift?.title || ""}
        revieweeName={ratingShift ? (db.getBusinessProfileById(ratingShift.business_id)?.company_name || "Employer") : "Employer"}
      />
    </div>
  );
}
