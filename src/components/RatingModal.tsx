import { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
  shiftTitle: string;
  revieweeName: string;
}

export function RatingModal({ isOpen, onClose, onSubmit, shiftTitle, revieweeName }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit(rating, feedback);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setFeedback('');
      onClose();
    }, 1500);
  };

  const displayRating = hoveredStar || rating;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm mx-4 bg-surface-800 rounded-2xl border border-surface-700 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">✅</span>
            <h3 className="text-lg font-bold text-white">Review Submitted!</h3>
            <p className="text-sm text-surface-400 mt-1">Thanks for your feedback.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Leave a Review</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-surface-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Context */}
            <div className="bg-surface-900 rounded-xl p-3 mb-5">
              <p className="text-xs text-surface-400">Shift</p>
              <p className="text-sm font-semibold text-white">{shiftTitle}</p>
              <p className="text-xs text-surface-400 mt-1">Rating for</p>
              <p className="text-sm font-semibold text-primary-500">{revieweeName}</p>
            </div>

            {/* Star Rating */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-surface-300 mb-2">Your Rating</p>
              <div className="flex gap-2 justify-center" data-testid="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className={`text-3xl transition-all duration-100 ${
                      star <= displayRating
                        ? 'text-primary-500 scale-110'
                        : 'text-surface-600 hover:text-surface-400'
                    }`}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <p className="text-center text-xs text-surface-400 mt-1">
                  {displayRating === 1 && 'Poor'}
                  {displayRating === 2 && 'Fair'}
                  {displayRating === 3 && 'Good'}
                  {displayRating === 4 && 'Great'}
                  {displayRating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Feedback Text */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-surface-300 mb-1.5 block">
                Feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                maxLength={500}
                className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 text-sm text-white placeholder-surface-500 focus:border-primary-500 focus:outline-none resize-none"
                data-testid="feedback-input"
              />
              <p className="text-right text-[10px] text-surface-500 mt-1">{feedback.length}/500</p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={rating < 1}
              className="w-full py-3.5 bg-primary-500 text-surface-900 font-bold text-sm rounded-xl hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              data-testid="submit-review-btn"
            >
              Submit Review
            </button>
          </>
        )}
      </div>
    </div>
  );
}
