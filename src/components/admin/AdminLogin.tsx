import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { useToast } from '../common/Toast.tsx';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToSite: () => void;
}

export function AdminLogin({ onSuccess, onBackToSite }: AdminLoginProps) {
  const { login } = useRestaurant();
  const { showToast } = useToast();

  // Email / Password Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email & Password Login Submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsEmailLoading(true);

    try {
      await login(email, password);
      showToast('Welcome back! Administrator authenticated.', 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-5">
          <OneBiteLogo size="lg" onClick={onBackToSite} />
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-black text-white tracking-tight">
          Motihari Outlet CMS
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-stone-400">
          Restaurant Owner & Management Portal
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900 border border-stone-800 py-7 px-6 sm:px-9 rounded-2xl shadow-2xl">
          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Authentication Notice:</span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Email & Password Login Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isEmailLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              <span>{isEmailLoading ? 'Verifying Admin...' : 'Sign In with Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

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
