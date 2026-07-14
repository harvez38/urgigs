import { useState } from 'react';

interface PostShiftFormData {
  role_title: string;
  description: string;
  hourly_rate: string;
  start_time: string;
  end_time: string;
}

interface PostShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PostShiftFormData) => void;
}

export function PostShiftModal({ isOpen, onClose, onSubmit }: PostShiftModalProps) {
  const [formData, setFormData] = useState<PostShiftFormData>({
    role_title: '',
    description: '',
    hourly_rate: '',
    start_time: '',
    end_time: '',
  });
  const [errors, setErrors] = useState<Partial<PostShiftFormData>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Partial<PostShiftFormData> = {};
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
    if (validate()) {
      onSubmit(formData);
      setFormData({ role_title: '', description: '', hourly_rate: '', start_time: '', end_time: '' });
      setErrors({});
    }
  };

  const updateField = (field: keyof PostShiftFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 rounded-t-3xl sm:rounded-3xl border border-surface-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-900 px-5 pt-5 pb-3 border-b border-surface-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Post a Shift</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white"
          >
            \u2715
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

          <div className="pt-3 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Post Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
