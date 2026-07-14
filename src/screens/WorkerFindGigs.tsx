import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';
import { ShiftCard } from '../components/ShiftCard';
import { Shift } from '../types';

type CategoryFilter = 'all' | string;

export function WorkerFindGigs() {
  const { currentUser, workerProfile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [displayShifts, setDisplayShifts] = useState<Shift[]>(() => db.getOpenShifts());

  const categories = ['all', ...new Set(displayShifts.map(s => s.category))];
  
  const filteredShifts = displayShifts.filter(shift => {
    const matchesCategory = activeCategory === 'all' || shift.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      shift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleClaim = (shiftId: string) => {
    if (!currentUser) return;
    const updated = db.claimShift(shiftId, currentUser.id);
    if (updated) {
      setClaimedIds(prev => new Set(prev).add(shiftId));
      // Keep the shift in the display list but mark as claimed
      setDisplayShifts(prev => prev.map(s => s.id === shiftId ? { ...s, status: 'assigned' as const, worker_id: currentUser.id } : s));
    }
  };

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      
      <div className="px-4 pt-5">
        {/* Welcome Section */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Find Gigs</h2>
          {workerProfile && (
            <p className="text-sm text-surface-400 mt-0.5">
              {workerProfile.gigs_completed} gigs completed \u00b7 \u2b50 {workerProfile.rating}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gigs by title, location..."
            className="input-field pl-10"
          />
        </div>

        {/* Category Chips */}
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

        {/* Available Shifts Section */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm">
            Available Shifts
            <span className="text-surface-500 font-normal ml-1.5">({filteredShifts.length})</span>
          </h3>
        </div>

        {filteredShifts.length === 0 ? (
          <EmptyState
            icon="\ud83d\udd0d"
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
                onClaim={handleClaim}
                claimed={claimedIds.has(shift.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
