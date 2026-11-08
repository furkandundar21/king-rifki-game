import React from 'react';
import { playCardClickSound } from '../utils/audio';

const STANDARD_SUITS = {
  H: { symbol: '♥', color: 'text-[#E11D48]', style: { color: '#E11D48' }, name: 'Kupa' },
  D: { symbol: '♦', color: 'text-[#E11D48]', style: { color: '#E11D48' }, name: 'Karo' },
  S: { symbol: '♠', color: 'text-[#0F172A]', style: { color: '#0F172A' }, name: 'Maça' },
  C: { symbol: '♣', color: 'text-[#0F172A]', style: { color: '#0F172A' }, name: 'Sinek' },
};

const FOUR_COLOR_SUITS = {
  H: { symbol: '♥', color: 'text-[#E11D48]', style: { color: '#E11D48' }, name: 'Kupa' },
  S: { symbol: '♠', color: 'text-[#0F172A]', style: { color: '#0F172A' }, name: 'Maça' },
  D: { symbol: '♦', color: 'text-[#2563EB]', style: { color: '#2563EB' }, name: 'Karo' },
  C: { symbol: '♣', color: 'text-[#16A34A]', style: { color: '#16A34A' }, name: 'Sinek' },
};

export default function Card({
  card,
  isSelected = false,
  isBack = false,
  onClick,
  size = 'md',
  disabled = false,
  className = '',
  isFourColor = false,
}) {
  const handleClick = (e) => {
    if (disabled || isBack) return;
    playCardClickSound();
    if (onClick) onClick(card, e);
  };

  if (isBack || !card) {
    const backSizes = {
      sm: 'w-7 h-10',
      md: 'w-[44px] xs:w-[48px] h-[68px] xs:h-[76px]',
      lg: 'w-14 h-21',
    };

    return (
      <div
        className={`${backSizes[size] || backSizes.md} rounded-xl bg-gradient-to-br from-blue-700 via-indigo-900 to-blue-950 border border-white/80 shadow-md flex items-center justify-center p-0.5 relative overflow-hidden transition-transform duration-200 select-none ${className}`}
      >
        <div className="w-full h-full rounded-lg border border-white/30 bg-blue-800 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border border-amber-300/70 bg-indigo-950 flex items-center justify-center text-[10px] text-amber-300 font-black shadow">
            ♠
          </div>
        </div>
      </div>
    );
  }

  const suitsDict = isFourColor ? FOUR_COLOR_SUITS : STANDARD_SUITS;
  const suitInfo = suitsDict[card.suit] || suitsDict.H;
  const isRifki = card.isRifki || (card.suit === 'H' && card.value === 13);

  const sizeClasses = {
    sm: 'w-9 h-13',
    md: 'w-[44px] xs:w-[48px] sm:w-[54px] h-[72px] xs:h-[78px] sm:h-[86px]',
    lg: 'w-15 h-22',
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative select-none rounded-xl bg-white card-shadow transition-all duration-200 flex flex-col justify-between p-1.5 cursor-pointer overflow-hidden
        ${sizeClasses[size] || sizeClasses.md}
        ${isSelected ? '-translate-y-4 ring-3 ring-amber-400 card-shadow-active scale-105 z-30 shadow-amber-400/30' : 'hover:-translate-y-1'}
        ${disabled ? 'opacity-35 grayscale-50 cursor-not-allowed pointer-events-none' : 'active:scale-95'}
        ${isRifki ? 'border-2 border-amber-400 ring-2 ring-amber-300/40' : 'border border-slate-300'}
        ${className}
      `}
      style={{ touchAction: 'manipulation' }}
    >
      {isRifki && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-1 py-0.2 text-[8px] font-black tracking-wider rounded-b shadow z-20 whitespace-nowrap">
          👑 RIFKI
        </div>
      )}

      <div className="flex flex-col items-start leading-none z-10" style={suitInfo.style}>
        <span className="font-black text-xl xs:text-2xl tracking-tighter leading-none font-['Outfit',sans-serif]">
          {card.label}
        </span>
        <span className="text-xs xs:text-sm font-bold leading-tight -mt-0.5">
          {suitInfo.symbol}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <span
          className="text-4xl xs:text-[44px] font-normal select-none leading-none opacity-90 transition-transform duration-200"
          style={suitInfo.style}
        >
          {suitInfo.symbol}
        </span>
      </div>
    </div>
  );
}
