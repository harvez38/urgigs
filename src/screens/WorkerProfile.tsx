import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { Review } from '../types';
import { submitScreening } from '../services/verification';
import { getRecentFeedback, renderStars } from '../services/reviews';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

export function WorkerProfile() {
  const { currentUser, workerProfile, updateWorkerProfile, refreshProfiles } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [editedSkills, setEditedSkills] = useState<string[]>(workerProfile?.skills_tags || []);
  const [saved, setSaved] = useState(false);
  const [submittingCheck, setSubmittingCheck] = useState(false);

  const handleAddSkill = () => {
    const trimmed = skillsInput.trim().toLowerCase();
    if (trimmed && !editedSkills.includes(trimmed)) {
      setEditedSkills(prev => [...prev, trimmed]);
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setEditedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSave = () => {
    updateWorkerProfile({ skills_tags: editedSkills });
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmitBackgroundCheck = async () => {
    if (!currentUser) return;
    setSubmittingCheck(true);
    await submitScreening(currentUser.id);
    db.updateBackgroundStatus(currentUser.id, 'pending');
    refreshProfiles();
    setSubmittingCheck(false);
  };


  // Reviews data
  const userReviews: Review[] = currentUser ? db.getReviewsForUser(currentUser.id) : [];
  const averageRating = currentUser ? db.getAverageRating(currentUser.id) : 0;
  const recentFeedback = getRecentFeedback(userReviews);
  const bgStatus = workerProfile?.background_check_status || 'unsubmitted';

  const bgStatusConfig: Record<string, { label: string; color: string; icon: string }> = {
    unsubmitted: { label: 'Not Submitted', color: 'text-surface-400', icon: '○' },
    pending: { label: 'Pending Review', color: 'text-amber-400', icon: '⏳' },
    passed: { label: 'Passed', color: 'text-success-400', icon: '✓' },
    failed: { label: 'Failed', color: 'text-alert-400', icon: '✗' },
  };

  const statusInfo = bgStatusConfig[bgStatus];

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      
      <div className="px-4 pt-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Settings & Profile</h2>
          <p className="text-sm text-surface-400 mt-0.5">Manage your worker profile</p>
        </div>

        {/* Profile Card */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-surface-900">
                {currentUser?.full_name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{currentUser?.full_name}</h3>
              <p className="text-sm text-surface-400">{currentUser?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-900 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-primary-500">{workerProfile?.gigs_completed}</p>
              <p className="text-[11px] text-surface-400">Gigs Done</p>
            </div>
            <div className="bg-surface-900 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-primary-500">⭐ {workerProfile?.rating}</p>
              <p className="text-[11px] text-surface-400">Rating</p>
            </div>
          </div>
        </div>


        {/* Ratings & Reviews Card */}
        {userReviews.length > 0 && (
          <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-5" data-testid="worker-reviews-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Ratings & Reviews</h3>
              <span className="text-xs text-surface-400">{userReviews.length} review{userReviews.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-primary-500">{averageRating > 0 ? averageRating.toFixed(1) : "-"}</span>
              <div>
                <p className="text-sm text-primary-400">{renderStars(averageRating)}</p>
                <p className="text-[11px] text-surface-400">Average from {userReviews.length} review{userReviews.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {recentFeedback.length > 0 && (
              <div className="space-y-2">
                {recentFeedback.map((fb, i) => (
                  <div key={i} className="bg-surface-900 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-primary-400">{"★".repeat(fb.stars)}{"☆".repeat(5 - fb.stars)}</span>
                      <span className="text-[10px] text-surface-500">{fb.date}</span>
                    </div>
                    <p className="text-xs text-surface-300">{fb.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Background Check Status Card */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-5" data-testid="background-check-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Background Check Status</h3>
            <span className={`text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>

          {bgStatus === 'unsubmitted' && (
            <div>
              <p className="text-xs text-surface-400 mb-3">
                Submit a background check to get verified and access more gigs.
              </p>
              <button
                onClick={handleSubmitBackgroundCheck}
                disabled={submittingCheck}
                className="w-full py-3 bg-primary-500 text-surface-900 font-bold text-sm rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submittingCheck ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  'Submit Background Check'
                )}
              </button>
            </div>
          )}

          {bgStatus === 'pending' && (
            <p className="text-xs text-surface-400">
              Your background check is being reviewed. This typically takes 1-3 business days.
            </p>
          )}

          {bgStatus === 'passed' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-success-500 bg-success-500/10 px-2.5 py-1 rounded-full">
                ✓ Verified Worker
              </span>
              <p className="text-xs text-surface-400">You're approved to accept all gig types.</p>
            </div>
          )}

          {bgStatus === 'failed' && (
            <p className="text-xs text-alert-400">
              Your background check did not pass. Please contact support for more information.
            </p>
          )}
        </div>

        {/* Skills Section */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Skills & Tags</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-primary-500 hover:text-primary-400"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="text-xs font-bold text-success-500 hover:text-success-400"
              >
                Save
              </button>
            )}
          </div>

          {saved && (
            <div className="bg-success-500/10 border border-success-500/30 text-success-500 text-xs font-medium px-3 py-2 rounded-lg mb-3">
              ✓ Skills updated successfully
            </div>
          )}

          {isEditing ? (
            <div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a skill and press Enter"
                  className="input-field flex-1 text-sm"
                />
                <button
                  onClick={handleAddSkill}
                  className="bg-primary-500 text-surface-900 font-bold px-3 rounded-xl text-sm hover:bg-primary-400"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editedSkills.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1 bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-full text-xs font-medium">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="text-primary-400 hover:text-alert-400 ml-1">×</button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(workerProfile?.skills_tags || []).map(skill => (
                <span key={skill} className="bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-full text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700">
          <h3 className="text-sm font-bold text-white mb-3">Account Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-400">Phone</span>
              <span className="text-sm text-white">{currentUser?.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-400">Availability</span>
              <span className="text-sm text-white capitalize">{workerProfile?.availability?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-400">Rate Range</span>
              <span className="text-sm text-white">${workerProfile?.hourly_rate_min} - ${workerProfile?.hourly_rate_max}/hr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-400">Experience</span>
              <span className="text-sm text-white">{workerProfile?.experience_years} years</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
