import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

export function PostShiftScreen() {
  const navigate = useNavigate();
  const { currentUser, businessProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    role_title: '',
    description: '',
    hourly_rate: '',
    start_time: '',
    end_time: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.role_title.trim()) newErrors.role_title = 'Role title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) newErrors.hourly_rate = 'Valid rate required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'End must be after start';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentUser || !businessProfile) return;

    db.createShift({
      business_id: businessProfile.id,
      posted_by: currentUser.id,
      worker_id: null,
      title: formData.role_title,
      description: formData.description,
      category: 'General',
      hourly_rate: parseFloat(formData.hourly_rate),
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      location: businessProfile.address,
      city: businessProfile.city,
      state: businessProfile.state,
      slots_total: 1,
      slots_filled: 0,
      status: 'open',
      requirements: [],
    });

    setSuccess(true);
    setTimeout(() => navigate('/employer'), 1500);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="screen-container bg-surface-900 pb-20">
      <Header />
      
      <div className="px-4 pt-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Post a Shift</h2>
          <p className="text-sm text-surface-400 mt-0.5">Create a new gig for workers to claim</p>
        </div>

        {success && (
          <div className="bg-success-500/10 border border-success-500/30 text-success-500 text-sm font-medium px-4 py-3 rounded-xl mb-4">
            \u2713 Shift posted successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Role Title *</label>
            <input
              type="text"
              value={formData.role_title}
              onChange={(e) => updateField('role_title', e.target.value)}
              placeholder="e.g., Bartender, Event Setup"
              className="input-field"
            />
            {errors.role_title && <p className="text-xs text-alert-500 mt-1">{errors.role_title}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe what the worker will be doing..."
              rows={3}
              className="input-field resize-none"
            />
            {errors.description && <p className="text-xs text-alert-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Hourly Rate ($) *</label>
            <input
              type="number"
              value={formData.hourly_rate}
              onChange={(e) => updateField('hourly_rate', e.target.value)}
              placeholder="25"
              min="1"
              step="0.50"
              className="input-field"
            />
            {errors.hourly_rate && <p className="text-xs text-alert-500 mt-1">{errors.hourly_rate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Start Time *</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => updateField('start_time', e.target.value)}
                className="input-field text-sm"
              />
              {errors.start_time && <p className="text-xs text-alert-500 mt-1">{errors.start_time}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-300 mb-1.5 block">End Time *</label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => updateField('end_time', e.target.value)}
                className="input-field text-sm"
              />
              {errors.end_time && <p className="text-xs text-alert-500 mt-1">{errors.end_time}</p>}
            </div>
          </div>

          <div className="pt-3">
            <button type="submit" className="btn-primary w-full" disabled={success}>
              {success ? 'Posted!' : 'Post Shift'}
            </button>
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
