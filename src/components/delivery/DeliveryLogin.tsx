import React, { useState } from 'react';
import { api, deliveryAuthStorage } from '../../services/api.ts';
import { auth, signInWithEmailAndPassword } from '../../services/firebase.ts';
import { OneBiteLogo } from '../common/OneBiteLogo.tsx';
import { useToast } from '../common/Toast.tsx';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Truck, AlertCircle, ArrowLeft } from 'lucide-react';

interface DeliveryLoginProps {
  onSuccess: () => void;
  onBackToSite: () => void;
}

export const DeliveryLogin: React.FC<DeliveryLoginProps> = ({
  onSuccess,
  onBackToSite,
}) => {
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Delivery ID or email');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanId = identifier.trim().toLowerCase();

      // 1. Try Firebase Auth first if email contains @
      if (cleanId.includes('@')) {
        try {
          const fbUserCred = await signInWithEmailAndPassword(auth, cleanId, password);
          if (fbUserCred.user) {
            await api.loginDeliveryFirebaseUser(fbUserCred.user.email || undefined);
            showToast('Delivery Partner login successful!', 'success');
            onSuccess();
            return;
          }
        } catch {
          // If Firebase Auth fails, seamlessly fall through to server verification
        }
      }

      // 2. Authorize via secure backend delivery endpoint
      const res = await api.deliveryLogin(cleanId, password);
      deliveryAuthStorage.setToken(res.token);
      showToast('Delivery Partner login successful!', 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Invalid delivery credentials. Please verify and try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 selection:bg-amber-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to One Bite Restaurant Website</span>
        </button>

        <div className="flex justify-center mb-4">
          <OneBiteLogo size="lg" showLocation />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-bold mb-2">
          <Truck className="w-3.5 h-3.5" />
          <span>Delivery Partner Portal</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Delivery Boy Login
        </h1>
        <p className="mt-1 text-xs text-stone-400 max-w-xs mx-auto">
          Sign in to view assigned delivery orders and confirm doorstep deliveries in real time.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900/90 py-8 px-5 sm:px-8 shadow-2xl rounded-3xl border border-stone-800 backdrop-blur-md">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="delivery-identifier"
                className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5"
              >
                Delivery ID or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="delivery-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="delivery@onebitemotihari.in"
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="delivery-password"
                className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="delivery-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In as Delivery Partner'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-stone-800 text-center">
            <span className="text-[11px] text-stone-500 block">
              Official One Bite Motihari delivery logistics panel.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
