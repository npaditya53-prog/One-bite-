import React, { useEffect } from 'react';
import { X, Clock, AlertCircle, Sparkles, MapPin } from 'lucide-react';
import { OneBiteLogo } from './OneBiteLogo.tsx';
import {
  RESTAURANT_CLOSED_TITLE,
  RESTAURANT_CLOSED_MESSAGE,
  RESTAURANT_SCHEDULE_TEXT,
  getIstTime,
} from '../../utils/operatingHours.ts';

interface RestaurantClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantClosedModal({ isOpen, onClose }: RestaurantClosedModalProps) {
  const currentIst = getIstTime();

  // Escape key listener to close cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="closed-modal-title"
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-center text-white space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close "X" Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <div className="flex justify-center pt-1">
          <OneBiteLogo size="md" showLocation />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-black">
          <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Orders Currently Closed</span>
        </div>

        {/* Heading & Exact Message */}
        <div className="space-y-3">
          <h2
            id="closed-modal-title"
            className="text-xl sm:text-2xl font-black text-white tracking-tight"
          >
            {RESTAURANT_CLOSED_TITLE}
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-sm mx-auto">
            {RESTAURANT_CLOSED_MESSAGE}
          </p>
        </div>

        {/* Operating Hours Details Card */}
        <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 font-semibold">Daily Operating Hours</span>
            <span className="font-extrabold text-amber-400 font-mono">
              {RESTAURANT_SCHEDULE_TEXT}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800/80">
            <span className="text-stone-400 font-semibold">Current Time (IST)</span>
            <span className="font-bold text-stone-200 font-mono">
              {currentIst.formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 pt-1">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">One Bite Motihari · Balua Chowk, Motihari</span>
          </div>
        </div>

        {/* Action Button: OK, Got It */}
        <div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-extrabold text-sm shadow-lg shadow-amber-600/25 transition-all cursor-pointer transform active:scale-[0.99]"
          >
            OK, Got It
          </button>
        </div>
      </div>
    </div>
  );
}
