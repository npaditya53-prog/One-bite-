import React from 'react';
import { FoodType } from '../../types/index.ts';

interface FoodTypeBadgeProps {
  type: FoodType;
  showText?: boolean;
  size?: 'sm' | 'md';
}

export function FoodTypeBadge({ type, showText = false, size = 'sm' }: FoodTypeBadgeProps) {
  const isVeg = type === 'veg';
  const boxSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className="inline-flex items-center gap-1.5 font-medium" title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}>
      <span
        className={`inline-flex items-center justify-center border ${boxSize} rounded-[3px] ${
          isVeg ? 'border-emerald-600 bg-white' : 'border-amber-900 bg-white'
        }`}
      >
        {isVeg ? (
          <span className={`${dotSize} rounded-full bg-emerald-600`} />
        ) : (
          <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-amber-900" />
        )}
      </span>
      {showText && (
        <span className={`text-xs uppercase tracking-wider ${isVeg ? 'text-emerald-700' : 'text-amber-900'}`}>
          {isVeg ? 'Pure Veg' : 'Non-Veg'}
        </span>
      )}
    </div>
  );
}
