import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundMuted, toggleSound } from '../../utils/sound.ts';

interface SoundToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.muted === 'boolean') {
        setMuted(customEvent.detail.muted);
      } else {
        setMuted(isSoundMuted());
      }
    };

    window.addEventListener('onebite_sound_mute_changed', handleMuteChange);
    return () => {
      window.removeEventListener('onebite_sound_mute_changed', handleMuteChange);
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = toggleSound();
    setMuted(newMuted);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      data-no-sound="true"
      aria-label={muted ? 'Unmute button click sounds' : 'Mute button click sounds'}
      title={muted ? 'Sounds are Muted (Click to Enable)' : 'Click Sounds Active (Click to Mute)'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-semibold ${
        muted
          ? 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
          : 'bg-stone-900/80 border-stone-800 text-amber-400 hover:text-amber-300 hover:border-amber-800/80'
      } ${className}`}
    >
      {muted ? (
        <VolumeX className="w-3.5 h-3.5 text-stone-400" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
      )}
      {showLabel && (
        <span className="hidden sm:inline text-[11px] font-medium">
          {muted ? 'Sound Off' : 'Sound On'}
        </span>
      )}
    </button>
  );
};
