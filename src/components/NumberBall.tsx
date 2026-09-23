import React from 'react';
import { getNumberMetadata } from '../lib/lotteryRules';

interface NumberBallProps {
  number: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  selected?: boolean;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NumberBall: React.FC<NumberBallProps> = ({
  number,
  size = 'md',
  showLabel = false,
  selected = false,
  pulse = false,
  onClick,
  className = '',
}) => {
  const meta = getNumberMetadata(number);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs font-bold',
    sm: 'w-8 h-8 text-sm font-bold',
    md: 'w-10 h-10 text-base font-extrabold',
    lg: 'w-14 h-14 text-xl font-black',
    xl: 'w-18 h-18 text-3xl font-black',
  }[size];

  // Render split gradient for 0 and 5
  let style: React.CSSProperties = {};
  if (number === 0) {
    style = {
      background: 'linear-gradient(135deg, #e11d48 50%, #9333ea 50%)',
    };
  } else if (number === 5) {
    style = {
      background: 'linear-gradient(135deg, #059669 50%, #9333ea 50%)',
    };
  } else if ([1, 3, 7, 9].includes(number)) {
    style = {
      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    };
  } else {
    // 2, 4, 6, 8 (Red)
    style = {
      background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    };
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        style={style}
        className={`
          ${sizeClasses}
          rounded-full flex items-center justify-center text-white
          shadow-lg shadow-black/40 border border-white/20
          transition-all duration-200 transform
          ${onClick ? 'cursor-pointer active:scale-95 hover:scale-105' : 'cursor-default'}
          ${selected ? 'ring-4 ring-pink-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''}
          ${pulse ? 'animate-pulse' : ''}
        `}
      >
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-mono">
          {number}
        </span>
      </button>

      {showLabel && (
        <div className="flex gap-1 items-center mt-1 text-[10px] text-slate-400 font-mono">
          <span className={meta.bigSmall === 'Big' ? 'text-amber-400 font-semibold' : 'text-cyan-400'}>
            {meta.bigSmall[0]}
          </span>
          <span>•</span>
          <span className={meta.color.includes('Red') ? 'text-rose-400' : 'text-emerald-400'}>
            {meta.color.replace('Purple', '+P')[0]}
          </span>
        </div>
      )}
    </div>
  );
};
