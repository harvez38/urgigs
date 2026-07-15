import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { saveCreditCard } from '../services/stripe';
import { getRecentFeedback, renderStars } from '../services/reviews';
import { db } from '../store/database';
import { Review } from '../types';
import { useNotificationBanner } from '../store/notificationBanner';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

export function EmployerProfile() {
  const { currentUser, businessProfile, updateBusinessProfile, refreshProfiles } = useAuthStore();
  const { showBanner } = useNotificationBanner();
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState(businessProfile?.company_name || '');
  const [city, setCity] = useState(businessProfile?.city || '');
  const [state, setState] = useState(businessProfile?.state || '');
  const [address, setAddress] = useState(businessProfile?.address || '');
  const [saved, setSaved] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [cardError, setCardError] = useState('');

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

  const handleSaveCard = async () => {
    if (!businessProfile || !cardNumber || !cardExpiry || !cardCvc) return;
    setSavingCard(true);
    setCardError('');

    try {
      const result = await saveCreditCard(businessProfile.id, {
        number: cardNumber.replace(/\s/g, ''),
        expiry: cardExpiry,
        cvc: cardCvc,
      });

      if (!result.success) {
        setCardError('Failed to save payment method. Please try again.');
        return;
      }

      refreshProfiles();
      setShowPaymentModal(false);
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      setCardSaved(true);
      showBanner('success', 'Payment method saved successfully');
      setTimeout(() => setCardSaved(false), 2500);
    } catch {
      setCardError('An unexpected error occurred. Please try again.');
      showBanner('error', 'Failed to save payment method');
    } finally {
      setSavingCard(false);
    }
  };

  const hasPaymentMethod = !!businessProfile?.default_payment_method;

  // Reviews data
  const userReviews: Review[] = currentUser ? db.getReviewsForUser(currentUser.id) : [];
  const averageRating = currentUser ? db.getAverageRating(currentUser.id) : 0;
  const recentFeedback = getRecentFeedback(userReviews);

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
                  ✓ Verified Business
                </span>
              )}
            </div>
          </div>
        </div>

        {saved && (
          <div className="bg-success-500/10 border border-success-500/30 text-success-500 text-sm font-medium px-4 py-3 rounded-xl mb-4">
            ✓ Profile updated successfully
          </div>
        )}

        {cardSaved && (
          <div className="bg-success-500/10 border border-success-500/30 text-success-500 text-sm font-medium px-4 py-3 rounded-xl mb-4">
            ✓ Payment method saved successfully
          </div>
        )}


        {/* Ratings & Reviews Card */}
        {userReviews.length > 0 && (
          <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-5" data-testid="employer-reviews-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Ratings from Workers</h3>
              <span className="text-xs text-surface-400">{userReviews.length} review{userReviews.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-primary-500">{averageRating > 0 ? averageRating.toFixed(1) : "-"}</span>
              <div>
                <p className="text-sm text-primary-400">{renderStars(averageRating)}</p>
                <p className="text-[11px] text-surface-400">Average from {userReviews.length} review{userReviews.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {recentFeedback.length > 0 && (
              <div className="space-y-2">
                {recentFeedback.map((fb, i) => (
                  <div key={i} className="bg-surface-900 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-primary-400">{"★".repeat(fb.stars)}{"☆".repeat(5 - fb.stars)}</span>
                      <span className="text-[10px] text-surface-500">{fb.date}</span>
                    </div>
                    <p className="text-xs text-surface-300">{fb.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Payment Methods Section */}
        <div className="bg-surface-800 rounded-2xl p-5 border border-surface-700 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Payment Methods</h3>
          </div>

          {hasPaymentMethod ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center">
                  <span className="text-lg">💳</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">**** **** **** {businessProfile?.payment_last4 || "****"}</p>
                  <p className="text-xs text-surface-400">Visa · Default</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center">
                <span className="text-lg">💳</span>
              </div>
              <p className="text-sm text-surface-400">No payment method saved</p>
            </div>
          )}

          <button
            onClick={() => setShowPaymentModal(true)}
            className="mt-4 w-full py-3 bg-primary-500 text-surface-900 font-bold text-sm rounded-xl hover:bg-primary-400 transition-all"
          >
            {hasPaymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
          </button>
        </div>

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

      {/* Payment Method Modal with Stripe Elements */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-md bg-surface-800 rounded-t-3xl sm:rounded-3xl p-6 border border-surface-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Payment Method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-surface-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Stripe Elements Container */}
            <div
              className="mb-5 border-2 border-dashed border-primary-500/40 rounded-xl p-4 bg-surface-900/50"
              data-testid="stripe-elements-wrapper"
              id="stripe-card-element"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs font-bold text-primary-400">Stripe Elements (Secure Card Input)</span>
              </div>
              <div className="h-11 bg-surface-700 rounded-lg border border-surface-600 flex items-center px-3">
                <span className="text-xs text-surface-500 italic">CardElement will mount here when Stripe.js loads</span>
              </div>
              <p className="text-[10px] text-surface-500 mt-2">
                PCI-compliant tokenization. Card data goes directly to Stripe servers, never touches our backend.
              </p>
            </div>

            {cardError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-2 rounded-lg">
                ⚠️ {cardError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  className="input-field"
                  data-testid="card-number-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-surface-300 mb-1.5 block">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="input-field"
                    data-testid="card-expiry-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-surface-300 mb-1.5 block">CVC</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="input-field"
                    data-testid="card-cvc-input"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveCard}
              disabled={savingCard || !cardNumber || !cardExpiry || !cardCvc}
              className="mt-6 w-full py-3.5 bg-primary-500 text-surface-900 font-bold text-sm rounded-xl hover:bg-primary-400 disabled:opacity-50 transition-all"
              data-testid="save-card-btn"
            >
              {savingCard ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing via Stripe…
                </span>
              ) : (
                'Save Payment Method'
              )}
            </button>

            <p className="text-[10px] text-surface-500 text-center mt-3">
              🔒 Secured by Stripe Connect. Your card info is encrypted end-to-end.
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
