import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.ts';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:right-auto md:left-6 md:bottom-6 z-50 flex items-center gap-2.5 rounded-xl bg-amber-900/95 text-amber-100 border border-amber-700/80 px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-md animate-bounce">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Offline Mode — Showing cached menu & site data</span>
    </div>
  );
};
