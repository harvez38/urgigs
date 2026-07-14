import { Shift } from '../types';

interface ShiftCardProps {
  shift: Shift;
  variant: 'employer' | 'worker';
  onClaim?: (shiftId: string) => void;
  claimed?: boolean;
}

export function ShiftCard({ shift, variant, onClaim, claimed }: ShiftCardProps) {
  const startDate = new Date(shift.start_time);
  const endDate = new Date(shift.end_time);
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  const statusColors: Record<string, string> = {
    open: 'bg-success-50 text-success-700 border-success-200',
    assigned: 'bg-primary-50 text-primary-700 border-primary-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-surface-200 text-surface-600 border-surface-300',
    paid: 'bg-success-100 text-success-700 border-success-300',
    cancelled: 'bg-alert-50 text-alert-700 border-alert-200',
  };

  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200 active:scale-[0.99]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-surface-900 text-[15px] leading-tight">{shift.title}</h3>
          <p className="text-xs text-surface-500 mt-1">{shift.category}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[shift.status]}`}>
          {shift.status.replace('_', ' ')}
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
        </div>
      )}

      {variant === 'worker' && (
        <div className="mt-3 pt-3 border-t border-surface-200 flex items-center justify-between">
          <span className="text-xs text-surface-500">
            {shift.status === 'open' ? `${shift.slots_total - shift.slots_filled} spots left` : 'Shift claimed'}
          </span>
          {claimed ? (
            <span className="text-xs font-semibold text-success-600 bg-success-50 px-3 py-1.5 rounded-lg">
              \u2713 Claimed
            </span>
          ) : shift.status === 'open' ? (
            <button
              onClick={() => onClaim?.(shift.id)}
              className="text-xs font-bold text-surface-900 bg-primary-500 px-4 py-1.5 rounded-lg hover:bg-primary-400 transition-colors active:scale-95"
            >
              Claim Shift
            </button>
          ) : null}
        </div>
      )}

      <div className="mt-2 text-[11px] text-surface-400">
        {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} \u00b7 {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} \u2013 {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </div>
    </div>
  );
}
