import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import {
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToSite: () => void;
}

export function AdminLogin({ onSuccess, onBackToSite }: AdminLoginProps) {
  const { loginWithGoogle } = useRestaurant();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await loginWithGoogle();
      showToast('Welcome back! Administrator verified.', 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Access Denied: This Google account is not authorized as an administrator.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to One Bite Restaurant Website</span>
        </button>

        <div className="flex justify-center mb-4">
          <OneBiteLogo size="lg" onClick={onBackToSite} showLocation />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-black mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Restaurant Owner & Admin CMS</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Admin Portal Login
        </h1>
        <p className="mt-1 text-xs text-stone-400 max-w-xs mx-auto">
          Sign in with your authorized Google Account to manage live orders, menu catalog, and delivery tasks.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900 border border-stone-800 py-8 px-6 sm:px-9 rounded-3xl shadow-2xl backdrop-blur-md">
          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-150">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-rose-300">Authentication Failed:</span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Official Google Sign-In Action */}
          <div className="space-y-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-900 font-extrabold text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer transform active:scale-[0.99] border border-stone-300"
              title="Sign in with your authorized Google Account"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                /* Official Google "G" Logo */
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
              <span>{isLoading ? 'Verifying with Google...' : 'Sign in with Google'}</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-stone-400 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Restricted Access</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Only the designated restaurant management Google email is granted administrator privileges. Unauthorized Google accounts will be rejected.
              </p>
            </div>
          </div>

          {/* Back to Website Link */}
          <div className="mt-6 pt-5 border-t border-stone-800 text-center">
            <button
              onClick={onBackToSite}
              className="text-xs font-semibold text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to One Bite Restaurant Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
