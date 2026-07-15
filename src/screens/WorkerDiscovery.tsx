import { useState, useMemo } from 'react';
import { db } from '../store/database';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';
import { renderStars } from '../services/reviews';

type SortBy = 'rating' | 'experience' | 'gigs';

export function WorkerDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('rating');

  const verifiedWorkers = useMemo(() => db.getVerifiedWorkers(), []);

  // Extract all unique skills from verified workers
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    verifiedWorkers.forEach(w => w.skills_tags.forEach(s => skills.add(s)));
    return ['all', ...Array.from(skills).sort()];
  }, [verifiedWorkers]);

  // Filter and sort workers
  const filteredWorkers = useMemo(() => {
    let workers = [...verifiedWorkers];

    // Filter by skill
    if (selectedSkill !== 'all') {
      workers = workers.filter(w => w.skills_tags.includes(selectedSkill));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      workers = workers.filter(w =>
        w.user_name.toLowerCase().includes(q) ||
        w.bio.toLowerCase().includes(q) ||
        w.skills_tags.some(s => s.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        workers.sort((a, b) => b.rating - a.rating);
        break;
      case 'experience':
        workers.sort((a, b) => b.experience_years - a.experience_years);
        break;
      case 'gigs':
        workers.sort((a, b) => b.gigs_completed - a.gigs_completed);
        break;
    }

    return workers;
  }, [verifiedWorkers, selectedSkill, searchQuery, sortBy]);

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />

      <div className="px-4 pt-5">
        {/* Page Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Discover Workers</h2>
          <p className="text-sm text-surface-400 mt-0.5">
            Browse verified workers by skills and ratings
          </p>
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
            placeholder="Search by name, skill, or bio..."
            className="input-field pl-10"
            data-testid="discovery-search"
          />
        </div>

        {/* Skill Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
          {allSkills.map(skill => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                selectedSkill === skill
                  ? 'bg-primary-500 text-surface-900 shadow-sm'
                  : 'bg-surface-800 text-surface-400 border border-surface-700 hover:border-primary-500/50'
              }`}
            >
              {skill === 'all' ? 'All Skills' : skill}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-surface-400 font-medium">
            {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''} found
          </span>
          <div className="flex gap-1 bg-surface-800 p-0.5 rounded-lg border border-surface-700">
            <button
              onClick={() => setSortBy('rating')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                sortBy === 'rating' ? 'bg-primary-500 text-surface-900' : 'text-surface-400'
              }`}
            >
              ⭐ Rating
            </button>
            <button
              onClick={() => setSortBy('experience')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                sortBy === 'experience' ? 'bg-primary-500 text-surface-900' : 'text-surface-400'
              }`}
            >
              📅 Exp
            </button>
            <button
              onClick={() => setSortBy('gigs')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                sortBy === 'gigs' ? 'bg-primary-500 text-surface-900' : 'text-surface-400'
              }`}
            >
              🎯 Gigs
            </button>
          </div>
        </div>

        {/* Worker List */}
        {filteredWorkers.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No workers found"
            description="Try adjusting your filters or search query."
          />
        ) : (
          <div className="space-y-3" data-testid="worker-list">
            {filteredWorkers.map(worker => (
              <div
                key={worker.id}
                className="bg-surface-800 rounded-2xl p-4 border border-surface-700 hover:border-primary-500/30 transition-all"
                data-testid={`worker-card-${worker.id}`}
              >
                {/* Worker Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary-500">
                      {worker.user_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white truncate">{worker.user_name}</h3>
                      <span className="text-[10px] font-semibold text-success-500 bg-success-500/10 px-2 py-0.5 rounded-full">
                        ✓ Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-primary-400">{renderStars(worker.rating)}</span>
                      <span className="text-xs text-surface-400 font-medium">{worker.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex gap-3 mb-3">
                  <div className="bg-surface-900 rounded-lg px-2.5 py-1.5 flex-1 text-center">
                    <p className="text-xs font-bold text-white">{worker.experience_years}yr</p>
                    <p className="text-[10px] text-surface-500">Experience</p>
                  </div>
                  <div className="bg-surface-900 rounded-lg px-2.5 py-1.5 flex-1 text-center">
                    <p className="text-xs font-bold text-white">{worker.gigs_completed}</p>
                    <p className="text-[10px] text-surface-500">Gigs Done</p>
                  </div>
                  <div className="bg-surface-900 rounded-lg px-2.5 py-1.5 flex-1 text-center">
                    <p className="text-xs font-bold text-white">${worker.hourly_rate_min}-${worker.hourly_rate_max}</p>
                    <p className="text-[10px] text-surface-500">$/hr</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {worker.skills_tags.slice(0, 4).map(skill => (
                    <span
                      key={skill}
                      className="text-[10px] font-medium bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {worker.skills_tags.length > 4 && (
                    <span className="text-[10px] text-surface-500">+{worker.skills_tags.length - 4} more</span>
                  )}
                </div>

                {/* Bio */}
                <p className="text-xs text-surface-400 line-clamp-2">{worker.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
