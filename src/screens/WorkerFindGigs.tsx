import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { db, ShiftWithBusiness } from '../store/database';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';
import { ShiftCard } from '../components/ShiftCard';

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

  const myShifts = currentUser ? db.getAssignedShiftsWithBusiness(currentUser.id) : [];
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
    if (selectedShift?.id === shiftId) setSelectedShift(null);
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
          <h2 className="text-xl font-bold text-white">{activeTab === 'find' ? 'Find Gigs' : 'My Schedule'}</h2>
          {workerProfile && <p className="text-sm text-surface-400 mt-0.5">{workerProfile.gigs_completed} gigs completed</p>}
        </div>

        <div className="flex bg-surface-800 rounded-xl p-1 mb-4 border border-surface-700">
          <button onClick={() => setActiveTab('find')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'find' ? 'bg-primary-500 text-surface-900 shadow-sm' : 'text-surface-400'}`}>Find Gigs</button>
          <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'schedule' ? 'bg-primary-500 text-surface-900 shadow-sm' : 'text-surface-400'}`}>My Schedule</button>
        </div>

        {activeTab === 'find' && (
          <>
            <div className="relative mb-4">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search gigs by title, company, location..." className="input-field pl-10" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${activeCategory === cat ? 'bg-primary-500 text-surface-900 shadow-sm' : 'bg-surface-800 text-surface-400 border border-surface-700'}`}>{cat === 'all' ? 'All Gigs' : cat}</button>
              ))}
            </div>
            <h3 className="font-bold text-white text-sm mb-3">Available Shifts <span className="text-surface-500 font-normal">({filteredShifts.length})</span></h3>
            {filteredShifts.length === 0 ? (
              <EmptyState icon="magnifying_glass" title="No gigs found" description="Try adjusting your search or filters." />
            ) : (
              <div className="space-y-3">
                {filteredShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} variant="worker" companyName={shift.company_name} estimatedTotalPay={shift.estimated_total_pay} onClaim={handleClaim} onDispute={handleDispute} onClick={handleCardClick} claimed={claimedIds.has(shift.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            <h3 className="font-bold text-white text-sm mb-3">Upcoming Shifts <span className="text-surface-500 font-normal">({myShifts.length})</span></h3>
            {myShifts.length === 0 ? (
              <EmptyState icon="calendar" title="No upcoming shifts" description="Claim open gigs to build your schedule." actionLabel="Find Gigs" onAction={() => setActiveTab('find')} />
            ) : (
              <div className="space-y-3">
                {myShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} variant="worker" companyName={shift.company_name} estimatedTotalPay={shift.estimated_total_pay} displayBadge="UPCOMING" onDispute={handleDispute} onClick={handleCardClick} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedShift && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-800 rounded-t-3xl border-t border-surface-700 p-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-surface-600 rounded-full mx-auto mb-5" />
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-700 text-surface-400 hover:text-white">X</button>
            <h2 className="text-lg font-bold text-white">{selectedShift.title}</h2>
            <p className="text-sm text-primary-500 font-semibold mt-1">{selectedShift.company_name}</p>
            <p className="text-xs text-surface-400 mt-0.5 mb-4">{selectedShift.category}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-700/50 rounded-xl p-3">
                <p className="text-[11px] text-surface-400 uppercase">Hourly Rate</p>
                <p className="text-base font-bold text-primary-500">${selectedShift.hourly_rate}/hr</p>
              </div>
              <div className="bg-surface-700/50 rounded-xl p-3">
                <p className="text-[11px] text-surface-400 uppercase">Est. Total</p>
                <p className="text-base font-bold text-success-500">${selectedShift.estimated_total_pay.toFixed(0)}</p>
              </div>
            </div>
            <p className="text-sm text-surface-300 leading-relaxed mb-4">{selectedShift.description}</p>
            <p className="text-sm text-surface-300 mb-4">{selectedShift.location}, {selectedShift.city}, {selectedShift.state}</p>
            {claimError && <div className="mb-4 p-3 rounded-xl bg-alert-500/10 border border-alert-500/30"><p className="text-sm text-alert-400">{claimError}</p></div>}
            {selectedShift.status === 'open' && !claimedIds.has(selectedShift.id) && <button onClick={() => handleClaim(selectedShift.id)} className="w-full btn-primary text-base font-bold py-4">Claim This Shift</button>}
            {claimedIds.has(selectedShift.id) && <div className="w-full text-center py-4 bg-success-500/10 border border-success-500/30 rounded-xl"><span className="text-success-500 font-bold">Shift Claimed!</span></div>}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
