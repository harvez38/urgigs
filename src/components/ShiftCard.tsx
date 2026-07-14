import { useState } from 'react';
import { Shift } from '../types';
import { getCurrentLocation } from '../services/location';
import { db } from '../store/database';

interface ShiftCardProps {
  shift: Shift;
  variant: 'employer' | 'worker';
  companyName?: string;
  estimatedTotalPay?: number;
  displayBadge?: string;
  onClaim?: (shiftId: string) => void;
  onApprovePayment?: (shiftId: string) => void;
  onDispute?: (shiftId: string) => void;
  onClick?: (shiftId: string) => void;
  claimed?: boolean;
  onRefresh?: () => void;
}

export function ShiftCard({ shift, variant, companyName, estimatedTotalPay, displayBadge, onClaim, onApprovePayment, onDispute, onClick, claimed, onRefresh }: ShiftCardProps) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const startDate = new Date(shift.start_time);
  const endDate = new Date(shift.end_time);
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  const getStatusBadge = (): string => {
    if (displayBadge) return displayBadge;
    if (shift.status === 'completed') return 'COMPLETED / PENDING PAYOUT';
    if (shift.status === 'disputed') return 'DISPUTED';
    if (shift.status === 'in_progress') return 'IN PROGRESS';
    return shift.status.replace('_', ' ').toUpperCase();
  };

  const badgeLabel = getStatusBadge();

  const statusColors: Record<string, string> = {
    open: 'bg-success-50 text-success-700 border-success-200',
    assigned: 'bg-primary-50 text-primary-700 border-primary-200',
    upcoming: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-amber-50 text-amber-700 border-amber-200',
    paid: 'bg-success-100 text-success-700 border-success-300',
    cancelled: 'bg-alert-50 text-alert-700 border-alert-200',
    disputed: 'bg-red-100 text-red-700 border-red-300',
  };

  const badgeColorKey = displayBadge === 'UPCOMING' ? 'upcoming' : shift.status;

  const totalPay = estimatedTotalPay ?? duration * shift.hourly_rate;

  const canDispute = ['assigned', 'in_progress', 'completed'].includes(shift.status) && onDispute;

  // Determine if shift starts today (for GPS check-in eligibility)
  const isToday = (): boolean => {
    const today = new Date();
    return (
      startDate.getFullYear() === today.getFullYear() &&
      startDate.getMonth() === today.getMonth() &&
      startDate.getDate() === today.getDate()
    );
  };

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckingIn(true);
    const coords = await getCurrentLocation();
    db.checkIn(shift.id, coords.lat, coords.lng);
    setCheckingIn(false);
    onRefresh?.();
  };

  const handleCheckOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckingOut(true);
    db.checkOut(shift.id);
    setCheckingOut(false);
    onRefresh?.();
  };

  const showCheckIn = variant === 'worker' && shift.status === 'assigned' && isToday();
  const showCheckOut = variant === 'worker' && shift.status === 'in_progress';

  return (
    <div
      className="card hover:shadow-card-hover transition-shadow duration-200 active:scale-[0.99] cursor-pointer"
      onClick={() => onClick?.(shift.id)}
      role="article"
      aria-label={shift.title}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-surface-900 text-[15px] leading-tight">{shift.title}</h3>
          {companyName && (
            <p className="text-xs text-primary-600 font-semibold mt-0.5">{companyName}</p>
          )}
          <p className="text-xs text-surface-500 mt-0.5">{shift.category}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[badgeColorKey] || statusColors[shift.status]}`}>
          {badgeLabel}
        </span>
      </div>

      <p className="text-sm text-surface-600 line-clamp-2 mb-3">{shift.description}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {shift.requirements.map((req, i) => (
          <span key={i} className="text-[11px] font-medium bg-surface-200 text-surface-600 px-2 py-0.5 rounded-md">
            {req}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-surface-200">
        <div className="flex items-center gap-3 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            \ud83d\udccd {shift.city}
          </span>
          <span className="flex items-center gap-1">
            \ud83d\udd50 {duration}h
          </span>
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-primary-600">${shift.hourly_rate}</span>
          <span className="text-[11px] text-surface-400">/hr</span>
        </div>
      </div>

      {/* Estimated Total Pay */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-surface-400">
          {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} \u00b7 {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} \u2013 {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
        <span className="text-xs font-bold text-success-600">
          Est. ${totalPay.toFixed(0)}
        </span>
      </div>

      {variant === 'employer' && (
        <div className="mt-3 pt-3 border-t border-surface-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500">
              {shift.slots_filled}/{shift.slots_total} slots filled
            </span>
            <div className="w-24 h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${(shift.slots_filled / shift.slots_total) * 100}%` }}
              />
            </div>
          </div>
          {shift.status === 'assigned' && onApprovePayment && (
            <button
              onClick={(e) => { e.stopPropagation(); onApprovePayment(shift.id); }}
              className="mt-3 w-full text-sm font-bold text-surface-900 bg-primary-500 px-4 py-2.5 rounded-xl hover:bg-primary-400 transition-colors active:scale-95"
            >
              Approve for Payment
            </button>
          )}
          {canDispute && (
            <button
              onClick={(e) => { e.stopPropagation(); onDispute(shift.id); }}
              className="mt-2 w-full text-xs font-semibold text-alert-500 bg-alert-500/10 border border-alert-500/30 px-4 py-2 rounded-xl hover:bg-alert-500/20 transition-colors active:scale-95"
              aria-label="Flag dispute"
            >
              \ud83d\udea9 Flag Dispute
            </button>
          )}
        </div>
      )}

      {variant === 'worker' && (
        <div className="mt-3 pt-3 border-t border-surface-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500">
              {shift.status === 'open' ? `${shift.slots_total - shift.slots_filled} spots left` : 'Shift claimed'}
            </span>
            {claimed ? (
              <span className="text-xs font-semibold text-success-600 bg-success-50 px-3 py-1.5 rounded-lg">
                \u2713 Claimed
              </span>
            ) : shift.status === 'open' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onClaim?.(shift.id); }}
                className="text-xs font-bold text-surface-900 bg-primary-500 px-4 py-1.5 rounded-lg hover:bg-primary-400 transition-colors active:scale-95"
              >
                Claim Shift
              </button>
            ) : null}
          </div>

          {/* GPS Check-In Button */}
          {showCheckIn && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="mt-3 w-full text-sm font-bold text-white bg-green-600 px-4 py-2.5 rounded-xl hover:bg-green-500 disabled:opacity-50 transition-colors active:scale-95 flex items-center justify-center gap-2"
              aria-label="GPS Check-In"
            >
              {checkingIn ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Locating\u2026
                </>
              ) : (
                <>\ud83d\udccd GPS Check-In</>
              )}
            </button>
          )}

          {/* GPS Check-Out Button */}
          {showCheckOut && (
            <button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="mt-3 w-full text-sm font-bold text-white bg-orange-600 px-4 py-2.5 rounded-xl hover:bg-orange-500 disabled:opacity-50 transition-colors active:scale-95 flex items-center justify-center gap-2"
              aria-label="GPS Check-Out"
            >
              {checkingOut ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing\u2026
                </>
              ) : (
                <>\ud83d\udccd GPS Check-Out</>
              )}
            </button>
          )}

          {canDispute && (
            <button
              onClick={(e) => { e.stopPropagation(); onDispute(shift.id); }}
              className="mt-2 w-full text-xs font-semibold text-alert-500 bg-alert-500/10 border border-alert-500/30 px-4 py-2 rounded-xl hover:bg-alert-500/20 transition-colors active:scale-95"
              aria-label="Flag dispute"
            >
              \ud83d\udea9 Flag Dispute
            </button>
          )}
        </div>
      )}
    </div>
  );
}
