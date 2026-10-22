import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { Download, Smartphone, X } from 'lucide-react';

export const InstallAppButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer ${className}`}
        title="Install ONE BITE App on your device for fast access"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSModal(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer ${className}`}
          title="Install ONE BITE App on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Install App</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-white relative">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <img src="/one-bite-icon.png" alt="One Bite" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">Install ONE BITE on iPhone / iPad</h3>
                  <p className="text-[11px] text-stone-400">Add to Home Screen for fast 1-tap ordering</p>
                </div>
              </div>
              <div className="space-y-3 text-xs text-stone-300 bg-stone-950 p-4 rounded-xl border border-stone-800/80 mb-4">
                <div className="flex items-start gap-2.5">
                  <span className="bg-amber-600 text-white font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari toolbar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="bg-amber-600 text-white font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="bg-amber-600 text-white font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span>Tap <strong>Add</strong> in top right corner. Enjoy instant app access!</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
