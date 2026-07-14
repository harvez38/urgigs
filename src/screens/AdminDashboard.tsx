import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { User, Shift, WorkerProfile } from '../types';

type AdminTab = 'users' | 'transactions' | 'disputes';

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

  void refreshKey;

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="bg-surface-800 border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-surface-900 font-bold text-sm">U</span>
          </div>
          <h1 className="text-lg font-bold text-white">UrGigs Admin</h1>
        </div>
        <button onClick={logout} className="text-sm text-surface-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-700">Logout</button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        </div>

        <div className="flex gap-1 bg-surface-800 p-1 rounded-xl mb-6 border border-surface-700">
          {(['users', 'transactions', 'disputes'] as AdminTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-150 ${activeTab === tab ? 'bg-primary-500 text-surface-900 shadow-sm' : 'text-surface-400 hover:text-white'}`}>
              {tab === 'users' ? `Users (${allUsers.length})` : tab === 'transactions' ? `Transactions (${completedPaidShifts.length})` : `Disputes (${disputedShifts.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div>
            <div className="relative mb-4">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users by name, email, or role..." className="w-full bg-surface-800 border border-surface-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500" />
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
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${user.role === 'business' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {user.role === 'business' ? 'Employer' : 'Worker'}
                      </span>
                    </div>
                    <div className="col-span-3">
                      {user.role === 'worker' && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isVerified ? 'bg-success-500/20 text-success-400' : 'bg-amber-500/20 text-amber-400'}`}>{isVerified ? 'Verified' : 'Unverified'}</span>}
                      {user.role === 'business' && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success-500/20 text-success-400">Active</span>}
                    </div>
                    <div className="col-span-3">
                      {user.role === 'worker' && !isVerified && <button onClick={() => handleVerifyWorker(user.id)} className="text-[11px] font-bold bg-primary-500 text-surface-900 px-3 py-1.5 rounded-lg hover:bg-primary-400 active:scale-95 transition-all">Verify</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              {completedPaidShifts.map((shift: Shift) => {
                const pay = calcShiftPay(shift);
                const fee = pay * 0.10;
                return (
                  <div key={shift.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-surface-700/50 items-center hover:bg-surface-700/30">
                    <div className="col-span-3"><p className="text-sm font-semibold text-white truncate">{shift.title}</p></div>
                    <div className="col-span-2"><p className="text-xs text-surface-300 truncate">{getBusinessName(shift)}</p></div>
                    <div className="col-span-2"><p className="text-xs text-surface-300 truncate">{getWorkerName(shift.worker_id)}</p></div>
                    <div className="col-span-2"><p className="text-sm font-bold text-white">${pay.toFixed(2)}</p></div>
                    <div className="col-span-1"><p className="text-xs text-success-400">${fee.toFixed(0)}</p></div>
                    <div className="col-span-2"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${shift.status === 'paid' ? 'bg-success-500/20 text-success-400' : 'bg-amber-500/20 text-amber-400'}`}>{shift.status === 'paid' ? 'Paid' : 'Pending'}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div>
            {disputedShifts.length === 0 ? (
              <div className="bg-surface-800 border border-surface-700 rounded-xl p-8 text-center">
                <p className="text-sm font-semibold text-white">No Active Disputes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputedShifts.map((shift: Shift) => {
                  const pay = calcShiftPay(shift);
                  return (
                    <div key={shift.id} className="bg-surface-800 border border-alert-500/30 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-white">{shift.title}</h3>
                      <p className="text-[11px] text-surface-400">{getBusinessName(shift)}</p>
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => handleResolveDispute(shift.id, 'approve')} className="flex-1 text-xs font-bold bg-success-500 text-white px-4 py-2.5 rounded-xl">Approve Payout</button>
                        <button onClick={() => handleResolveDispute(shift.id, 'refund')} className="flex-1 text-xs font-bold bg-alert-500 text-white px-4 py-2.5 rounded-xl">Refund Employer</button>
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
