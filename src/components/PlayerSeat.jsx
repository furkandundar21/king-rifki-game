import React from 'react';
import Card from './Card';
import { User, Sparkles, WifiOff } from 'lucide-react';

export default function PlayerSeat({
  player,
  position = 'top',
  isTurn = false,
  taunt = null,
  isSelf = false,
  livePenalty = null,
}) {
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-emerald-700/50 bg-emerald-950/20 backdrop-blur-xs text-emerald-500/60 text-xs">
        <User className="w-5 h-5 mb-1 opacity-40" />
        <span className="text-[10px] font-medium">Boş Koltuk</span>
      </div>
    );
  }

  const bubblePositionClass = {
    top: 'top-12 left-1/2 -translate-x-1/2 speech-bubble-top',
    bottom: '-top-12 left-1/2 -translate-x-1/2 speech-bubble-bottom',
    left: 'top-1/2 left-16 -translate-y-1/2 speech-bubble-left',
    right: 'top-1/2 right-16 -translate-y-1/2 speech-bubble-right',
  }[position] || 'bottom-12 speech-bubble-bottom';

  const initials = player.name ? player.name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="relative flex flex-col items-center">
      {taunt && (
        <div
          className={`
            absolute z-50 animate-pop-in pointer-events-none whitespace-nowrap
            bg-white text-slate-900 font-extrabold text-xs sm:text-sm px-3 py-1.5 rounded-2xl shadow-2xl border-2 border-amber-400
            ${bubblePositionClass}
          `}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 text-xs">💬</span>
            <span>{taunt.text}</span>
          </div>
        </div>
      )}

      <div
        className={`
          flex items-center gap-2 px-2.5 py-1.5 rounded-2xl backdrop-blur-md transition-all duration-300
          ${isTurn ? 'bg-amber-500/20 border-2 border-amber-400 ring-4 ring-amber-400/20 scale-105' : 'bg-slate-900/80 border border-emerald-500/30'}
          ${!player.connected ? 'opacity-60' : ''}
        `}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 border border-emerald-300 flex items-center justify-center font-black text-xs text-white shadow">
            {initials}
          </div>

          {!player.connected && (
            <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-0.5" title="Bağlantı koptu">
              <WifiOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}

          {isTurn && (
            <div className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 animate-bounce shadow">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className="font-bold text-xs text-slate-100 max-w-[80px] truncate">
              {player.name}
            </span>
            {isSelf && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-600/40">
                BEN
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
            <span className="font-semibold text-amber-300 bg-slate-950/60 px-1 rounded border border-slate-700/50">
              {player.penaltiesLeft ?? 3}C | {player.trumpsLeft ?? 2}K
            </span>

            {livePenalty && (
              <span className="font-black text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded-full border border-rose-500/60 animate-pulse text-[9px] shadow">
                {livePenalty}
              </span>
            )}

            {(player.tricksWon !== undefined && player.tricksWon > 0) && (
              <span className="font-bold text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-600/40" title="Aldığı El Sayısı">
                ✋ {player.tricksWon}
              </span>
            )}

            <div className="flex items-center gap-0.5 text-emerald-300 font-bold">
              <span className="text-[9px]">🂠</span>
              <span>{player.handCount ?? 13}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
