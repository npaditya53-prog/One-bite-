import React from 'react';

interface OneBiteLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLocation?: boolean;
  className?: string;
  alt?: string;
  onClick?: () => void;
}

export function OneBiteLogo({
  size = 'md',
  showLocation = false,
  className = '',
  alt = 'One Bite Motihari Official Brand Logo',
  onClick,
}: OneBiteLogoProps) {
  // Height classes with responsive scaling, always maintaining aspect ratio
  const sizeClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9 md:h-10',
    lg: 'h-10 sm:h-12',
    xl: 'h-12 sm:h-14 md:h-16',
  }[size];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src="/one-bite-logo.png"
        alt={alt}
        className={`${sizeClasses} w-auto object-contain shrink-0`}
        loading="eager"
        decoding="async"
      />

      {showLocation && (
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 pl-2 border-l border-stone-700/80 shrink-0">
          Motihari
        </span>
      )}
    </div>
  );
}
