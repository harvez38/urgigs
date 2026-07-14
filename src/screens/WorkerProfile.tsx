import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

export function WorkerProfile() {
  const { currentUser, workerProfile, updateWorkerProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [editedSkills, setEditedSkills] = useState<string[]>(workerProfile?.skills_tags || []);
  const [saved, setSaved] = useState(false);

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
              <p className="text-lg font-bold text-primary-500">\u2b50 {workerProfile?.rating}</p>
              <p className="text-[11px] text-surface-400">Rating</p>
            </div>
          </div>
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
              \u2713 Skills updated successfully
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
                    <button onClick={() => handleRemoveSkill(skill)} className="text-primary-400 hover:text-alert-400 ml-1">\u00d7</button>
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
