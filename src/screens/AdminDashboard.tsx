import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { User, Shift, WorkerProfile } from '../types';
import { IS_STRIPE_LIVE } from '../config/stripe';

type AdminTab = 'users' | 'transactions' | 'disputes' | 'background_checks';

export function AdminDashboard() {
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const stats = db.getAdminStats();
  const allUsers = db.getAllUsers().filter(u => u.role !== 'admin');
  const disputedShifts = db.getDisputedShifts();
  const allShifts = db.getAllShifts();
  const completedPaidShifts = allShifts.filter(s => s.status === 'completed' || s.status === 'paid');
  const pendingBackgroundChecks = db.getPendingBackgroundChecks();

  const filteredUsers = allUsers.filter(u =>
    searchQuery === '' ||
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWorkerProfile = (userId: string): WorkerProfile | undefined => {
    return db.getWorkerProfileByUserId(userId);
  };

  const handleVerifyWorker = (userId: string) => {
    db.verifyWorker(userId);
    refresh();
  };

  const handleResolveDispute = (shiftId: string, resolution: 'approve' | 'refund') => {
    db.resolveDispute(shiftId, resolution);
    refresh();
  };

  const handleApproveBackground = (workerId: string) => {
    db.updateBackgroundStatus(workerId, 'passed');
    refresh();
  };

  const handleRejectBackground = (workerId: string) => {
    db.updateBackgroundStatus(workerId, 'failed');
    refresh();
  };

  const calcShiftPay = (shift: Shift): number => {
    const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60);
    return shift.hourly_rate * hours;
  };

  const getWorkerName = (workerId: string | null): string => {
    if (!workerId) return 'Unassigned';
    const user = db.getUserById(workerId);
    return user?.full_name ?? 'Unknown';
  };

  const getBusinessName = (shift: Shift): string => {
    const bp = db.getBusinessProfileById(shift.business_id);
    return bp?.company_name ?? 'Unknown Business';
  };

  // Force re-read on refreshKey change
  void refreshKey;

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Top Nav */}
      <div className="bg-surface-800 border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-surface-900 font-bold text-sm">U</span>
          </div>
          <h1 className="text-lg font-bold text-white">UrGigs Admin</h1>
        </div>
        <button
          onClick={logout}
          className="text-sm text-surface-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-700"
        >
          Logout
        </button>
      </div>

      {/* Stripe Connection Status Banner */}
      {IS_STRIPE_LIVE ? (
        <div
          data-testid="stripe-status-banner"
          className="bg-green-600/20 border-b border-green-500/30 px-6 py-2.5 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-green-300">
            Stripe Live/Test Environment Connected
          </span>
        </div>
      ) : (
        <div
          data-testid="stripe-status-banner"
          className="bg-amber-600/20 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-amber-300">
            Stripe Credentials Missing - Running in Mock Mode
          </span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
            <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">Platform Volume</p>
            <p className="text-2xl font-bold text-primary-500 mt-1">${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
            <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">Platform Fees (10%)</p>
            <p className="text-2xl font-bold text-success-500 mt-1">${stats.totalFees.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
            <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">Total Shifts</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalShifts}</p>
          </div>
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
            <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">Active Disputes</p>
            <p className="text-2xl font-bold text-alert-500 mt-1">{stats.disputedShifts}</p>
          </div>
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
            <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">Pending BG Checks</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingBackgroundChecks.length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-surface-800 p-1 rounded-xl mb-6 border border-surface-700 overflow-x-auto">
          {(['users', 'transactions', 'disputes', 'background_checks'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-150 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-primary-500 text-surface-900 shadow-sm'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              {tab === 'users' ? `Users (${allUsers.length})` :
               tab === 'transactions' ? `Transactions (${completedPaidShifts.length})` :
               tab === 'disputes' ? `Disputes (${disputedShifts.length})` :
               `BG Checks (${pendingBackgroundChecks.length})`}
            </button>
          ))}
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="relative mb-4">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email, or role..."
                className="w-full bg-surface-800 border border-surface-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-surface-700 text-[11px] text-surface-400 uppercase tracking-wide font-medium">
                <span className="col-span-4">User</span>
                <span className="col-span-2">Role</span>
                <span className="col-span-3">Status</span>
                <span className="col-span-3">Actions</span>
              </div>
              {filteredUsers.map((user: User) => {
                const wp = user.role === 'worker' ? getWorkerProfile(user.id) : undefined;
                const isVerified = wp?.is_verified ?? false;
                return (
                  <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-surface-700/50 items-center hover:bg-surface-700/30 transition-colors">
                    <div className="col-span-4">
                      <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                      <p className="text-[11px] text-surface-400 truncate">{user.email}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        user.role === 'business' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {user.role === 'business' ? 'Employer' : 'Worker'}
                      </span>
                    </div>
                    <div className="col-span-3">
                      {user.role === 'worker' && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isVerified ? 'bg-success-500/20 text-success-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isVerified ? '\u2713 Verified' : '\u23f3 Unverified'}
                        </span>
                      )}
                      {user.role === 'business' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success-500/20 text-success-400">
                          \u2713 Active
                        </span>
                      )}
                    </div>
                    <div className="col-span-3">
                      {user.role === 'worker' && !isVerified && (
                        <button
                          onClick={() => handleVerifyWorker(user.id)}
                          className="text-[11px] font-bold bg-primary-500 text-surface-900 px-3 py-1.5 rounded-lg hover:bg-primary-400 active:scale-95 transition-all"
                        >
                          Verify
                        </button>
                      )}
                      {user.role === 'worker' && isVerified && (
                        <span className="text-[11px] text-surface-500">\u2014</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-surface-500">
                  No users match your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-surface-800 border border-primary-500/30 rounded-xl p-4">
                <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">Total Volume</p>
                <p className="text-xl font-bold text-primary-500 mt-1">${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-surface-800 border border-success-500/30 rounded-xl p-4">
                <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">Platform Revenue (10%)</p>
                <p className="text-xl font-bold text-success-500 mt-1">${stats.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-surface-700 text-[11px] text-surface-400 uppercase tracking-wide font-medium">
                <span className="col-span-3">Shift</span>
                <span className="col-span-2">Business</span>
                <span className="col-span-2">Worker</span>
                <span className="col-span-2">Amount</span>
                <span className="col-span-1">Fee</span>
                <span className="col-span-2">Status</span>
              </div>
              {completedPaidShifts.map((shift: Shift) => {
                const pay = calcShiftPay(shift);
                const fee = pay * 0.10;
                return (
                  <div key={shift.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-surface-700/50 items-center hover:bg-surface-700/30 transition-colors">
                    <div className="col-span-3">
                      <p className="text-sm font-semibold text-white truncate">{shift.title}</p>
                      <p className="text-[11px] text-surface-400">{new Date(shift.start_time).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-surface-300 truncate">{getBusinessName(shift)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-surface-300 truncate">{getWorkerName(shift.worker_id)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-white">${pay.toFixed(2)}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-success-400">${fee.toFixed(0)}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        shift.status === 'paid' ? 'bg-success-500/20 text-success-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {shift.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {completedPaidShifts.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-surface-500">
                  No completed transactions yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div>
            {disputedShifts.length === 0 ? (
              <div className="bg-surface-800 border border-surface-700 rounded-xl p-8 text-center">
                <p className="text-3xl mb-3">\u2705</p>
                <p className="text-sm font-semibold text-white">No Active Disputes</p>
                <p className="text-xs text-surface-400 mt-1">All disputes have been resolved.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputedShifts.map((shift: Shift) => {
                  const pay = calcShiftPay(shift);
                  return (
                    <div key={shift.id} className="bg-surface-800 border border-alert-500/30 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">{shift.title}</h3>
                          <p className="text-[11px] text-surface-400 mt-0.5">{getBusinessName(shift)} \u00b7 {shift.city}, {shift.state}</p>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-alert-500/20 text-alert-400 border border-alert-500/30">
                          DISPUTED
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-surface-700/50 rounded-lg p-2.5">
                          <p className="text-[10px] text-surface-400 uppercase">Worker</p>
                          <p className="text-xs font-semibold text-white mt-0.5">{getWorkerName(shift.worker_id)}</p>
                        </div>
                        <div className="bg-surface-700/50 rounded-lg p-2.5">
                          <p className="text-[10px] text-surface-400 uppercase">Amount</p>
                          <p className="text-xs font-semibold text-primary-500 mt-0.5">${pay.toFixed(2)}</p>
                        </div>
                        <div className="bg-surface-700/50 rounded-lg p-2.5">
                          <p className="text-[10px] text-surface-400 uppercase">Date</p>
                          <p className="text-xs font-semibold text-white mt-0.5">{new Date(shift.start_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleResolveDispute(shift.id, 'approve')}
                          className="flex-1 text-xs font-bold bg-success-500 text-white px-4 py-2.5 rounded-xl hover:bg-success-400 active:scale-95 transition-all"
                        >
                          \u2713 Approve Worker Payout
                        </button>
                        <button
                          onClick={() => handleResolveDispute(shift.id, 'refund')}
                          className="flex-1 text-xs font-bold bg-alert-500 text-white px-4 py-2.5 rounded-xl hover:bg-alert-400 active:scale-95 transition-all"
                        >
                          \u21a9 Refund Employer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Background Checks Tab */}
        {activeTab === 'background_checks' && (
          <div data-testid="admin-background-checks">
            <h3 className="text-sm font-bold text-white mb-4">Pending Background Checks</h3>
            {pendingBackgroundChecks.length === 0 ? (
              <div className="bg-surface-800 border border-surface-700 rounded-xl p-8 text-center">
                <p className="text-3xl mb-3">\u2705</p>
                <p className="text-sm font-semibold text-white">No Pending Background Checks</p>
                <p className="text-xs text-surface-400 mt-1">All background checks have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBackgroundChecks.map((wp: WorkerProfile) => {
                  const user = db.getUserById(wp.user_id);
                  return (
                    <div key={wp.id} className="bg-surface-800 border border-amber-500/30 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">{user?.full_name ?? 'Unknown Worker'}</h3>
                          <p className="text-[11px] text-surface-400 mt-0.5">{user?.email}</p>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          \u23f3 PENDING
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-surface-700/50 rounded-lg p-2.5">
                          <p className="text-[10px] text-surface-400 uppercase">Experience</p>
                          <p className="text-xs font-semibold text-white mt-0.5">{wp.experience_years} years</p>
                        </div>
                        <div className="bg-surface-700/50 rounded-lg p-2.5">
                          <p className="text-[10px] text-surface-400 uppercase">Gigs Done</p>
                          <p className="text-xs font-semibold text-primary-500 mt-0.5">{wp.gigs_completed}</p>
                        </div>
                        <div className="bg-surface-700/50 rounded-lg p-2.5">
                          <p className="text-[10px] text-surface-400 uppercase">Rating</p>
                          <p className="text-xs font-semibold text-white mt-0.5">\u2b50 {wp.rating}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveBackground(wp.user_id)}
                          className="flex-1 text-xs font-bold bg-success-500 text-white px-4 py-2.5 rounded-xl hover:bg-success-400 active:scale-95 transition-all"
                        >
                          \u2713 Approve (Pass)
                        </button>
                        <button
                          onClick={() => handleRejectBackground(wp.user_id)}
                          className="flex-1 text-xs font-bold bg-alert-500 text-white px-4 py-2.5 rounded-xl hover:bg-alert-400 active:scale-95 transition-all"
                        >
                          \u2717 Reject (Fail)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
