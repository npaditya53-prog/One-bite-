import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import { X, Sparkles, ShoppingBag, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

interface CustomerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (role: 'admin' | 'customer') => void;
  title?: string;
  subtitle?: string;
}

export function CustomerOnboardingModal({
  isOpen,
  onClose,
  onSuccessRole,
  title = 'Welcome to One Bite Motihari',
  subtitle = 'Sign in with Google to track your orders in real time, view your order history, and enjoy fast ordering.',
}: CustomerOnboardingModalProps) {
  const { loginWithGoogle } = useRestaurant();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await loginWithGoogle();
      if (result.isAdmin) {
        showToast('Welcome Administrator! Redirecting to Admin Panel...', 'success');
        if (onSuccessRole) onSuccessRole('admin');
      } else {
        const name = result.user.displayName || 'Food Lover';
        showToast(`Welcome back, ${name}! Signed in successfully.`, 'success');
        if (onSuccessRole) onSuccessRole('customer');
      }
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in could not be completed. Please try again.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center text-white space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo & Location */}
        <div className="flex justify-center pt-2">
          <OneBiteLogo size="lg" showLocation />
        </div>

        {/* Welcome Heading & Message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast, Fresh & Delicious Fast Food</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Feature Highlights for Customer */}
        <div className="grid grid-cols-3 gap-2 py-2 text-[11px] text-stone-300">
          <div className="bg-stone-950/60 p-2.5 rounded-2xl border border-stone-800/80 flex flex-col items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-center">Live Order Tracking</span>
          </div>
          <div className="bg-stone-950/60 p-2.5 rounded-2xl border border-stone-800/80 flex flex-col items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-center">Order History</span>
          </div>
          <div className="bg-stone-950/60 p-2.5 rounded-2xl border border-stone-800/80 flex flex-col items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-center">Safe & Fast Sign-In</span>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Prominent Google Sign-in Button */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-900 font-extrabold text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer transform active:scale-[0.99] border border-stone-300"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Continue as Guest option */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors py-1 cursor-pointer font-medium"
          >
            Continue as Guest / Explore Menu
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-[10px] text-stone-500 leading-relaxed pt-2 border-t border-stone-800">
          By continuing, you agree to One Bite Motihari terms of service. Administrators and customers are automatically identified upon sign-in.
        </p>
      </div>
    </div>
  );
}
