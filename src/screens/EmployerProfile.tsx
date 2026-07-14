import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

export function EmployerProfile() {
  const { currentUser, businessProfile, updateBusinessProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState(businessProfile?.company_name || '');
  const [city, setCity] = useState(businessProfile?.city || '');
  const [state, setState] = useState(businessProfile?.state || '');
  const [address, setAddress] = useState(businessProfile?.address || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateBusinessProfile({
      company_name: companyName,
      city,
      state,
      address,
    });
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setCompanyName(businessProfile?.company_name || '');
    setCity(businessProfile?.city || '');
    setState(businessProfile?.state || '');
    setAddress(businessProfile?.address || '');
    setIsEditing(false);
  };

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      
      <div className="px-4 pt-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Settings & Profile</h2>
          <p className="text-sm text-surface-400 mt-0.5">Manage your business profile</p>
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
              {businessProfile?.verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success-500 bg-success-500/10 px-2 py-0.5 rounded-full mt-1">
                  \u2713 Verified Business
                </span>
              )}
            </div>
          </div>
        </div>

        {saved && (
          <div className="bg-success-500/10 border border-success-500/30 text-success-500 text-sm font-medium px-4 py-3 rounded-xl mb-4">
            \u2713 Profile updated successfully
          </div>
        )}

        {/* Business Info Section */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Business Information</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-primary-500 hover:text-primary-400"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="text-xs font-semibold text-surface-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="text-xs font-bold text-success-500 hover:text-success-400"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-surface-300 mb-1.5 block">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-surface-300 mb-1.5 block">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-400">Company</span>
                <span className="text-sm text-white font-medium">{businessProfile?.company_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-400">Industry</span>
                <span className="text-sm text-white">{businessProfile?.industry}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-400">Address</span>
                <span className="text-sm text-white">{businessProfile?.address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-400">Location</span>
                <span className="text-sm text-white">{businessProfile?.city}, {businessProfile?.state}</span>
              </div>
            </div>
          )}
        </div>

        {/* Account Section */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700">
          <h3 className="text-sm font-bold text-white mb-3">Account Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-400">Email</span>
              <span className="text-sm text-white">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-400">Phone</span>
              <span className="text-sm text-white">{currentUser?.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-400">Member Since</span>
              <span className="text-sm text-white">
                {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
