import { Review } from '../types';

/**
 * Calculate the average rating from a list of reviews.
 * Returns 0 if no reviews exist.
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating_stars, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Format feedback snippets for display - truncate long text.
 */
export function formatFeedbackSnippet(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '\u2026';
}

/**
 * Generate star display string (e.g. "\u2605\u2605\u2605\u2605\u2606" for 4 stars).
 */
export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return '\u2605'.repeat(full) + '\u2606'.repeat(empty);
}

/**
 * Get the most recent N feedback snippets from reviews.
 */
export function getRecentFeedback(reviews: Review[], count: number = 3): { text: string; stars: number; date: string }[] {
  return reviews
    .slice(0, count)
    .map(r => ({
      text: formatFeedbackSnippet(r.feedback_text),
      stars: r.rating_stars,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
}
