import React from 'react';
import Card from './Card';
import { User, ShieldAlert, Sparkles, WifiOff, Clock } from 'lucide-react';

export default function PlayerSeat({
  player,
  position = 'top', // 'top' | 'left' | 'right' | 'bottom'
  isTurn = false,
  secondsLeft = 30,
  isKaro2 = false,
  taunt = null,
  isSelf = false,
  livePenalty = null, // '👑 RIFKI!' | '👸 x2' | '♥ x3' vb.
}) {
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-emerald-700/50 bg-emerald-950/20 backdrop-blur-xs text-emerald-500/60 text-xs">
        <User className="w-5 h-5 mb-1 opacity-40" />
        <span className="text-[10px] font-medium">Boş Koltuk</span>
      </div>
    );
  }

  // Konuşma balonunun kuyruk sınıfı
  const bubblePositionClass = {
    top: 'top-12 left-1/2 -translate-x-1/2 speech-bubble-top',
    bottom: '-top-12 left-1/2 -translate-x-1/2 speech-bubble-bottom',
    left: 'top-1/2 left-16 -translate-y-1/2 speech-bubble-left',
    right: 'top-1/2 right-16 -translate-y-1/2 speech-bubble-right',
  }[position] || 'bottom-12 speech-bubble-bottom';

  // Oyuncu avatar baş harfi
  const initials = player.name ? player.name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="relative flex flex-col items-center">
      {/* Konuşma Balonu (Laf Atıldığında Görünen Çizgi Roman Balonu) */}
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

      {/* Oyuncu Kartı / Kutusu */}
      <div
        className={`
          relative flex items-center gap-2 px-2.5 py-1.5 rounded-2xl backdrop-blur-md transition-all duration-300
          ${isTurn ? 'bg-amber-500/20 border-2 border-amber-400 ring-4 ring-amber-400/20 scale-105 shadow-xl' : 'bg-slate-900/80 border border-emerald-500/30'}
          ${!player.connected ? 'opacity-60' : ''}
        `}
      >
        {/* 30 Saniye Geri Sayım Rozeti (Sıra bu oyuncudayken görünür) */}
        {isTurn && (
          <div
            className={`absolute -top-3.5 right-2 z-20 text-[10px] font-black px-2 py-0.5 rounded-full border shadow-lg flex items-center gap-1 transition-all duration-300 ${
              (secondsLeft ?? 30) <= 10
                ? 'bg-rose-600 text-white border-rose-300 animate-pulse scale-110'
                : 'bg-amber-400 text-slate-950 border-amber-200'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>{secondsLeft ?? 30}s</span>
          </div>
        )}

        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 border border-emerald-300 flex items-center justify-center font-black text-xs text-white shadow">
            {initials}
          </div>

          {/* Bağlantı koptu rozeti */}
          {!player.connected && (
            <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-0.5" title="Bağlantı koptu">
              <WifiOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}

          {/* Sıra onda ise ışıltı rozeti */}
          {isTurn && (
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 animate-bounce shadow">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        {/* Oyuncu Bilgileri */}
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
            {/* 1. Elde Karo 2 rozeti */}
            {isKaro2 && (
              <span className="text-[9px] font-black text-rose-300 bg-rose-950 px-1 rounded border border-rose-500/60" title="Karo 2 Bu Oyuncuda">
                ♦2
              </span>
            )}
          </div>

          {/* Kalan Haklar ve Kart Sayısı */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
            {/* Ceza ve Koz Kalan Sayısı */}
            <span className="font-semibold text-amber-300 bg-slate-950/60 px-1 rounded border border-slate-700/50">
              {player.penaltiesLeft ?? 3}C | {player.trumpsLeft ?? 2}K
            </span>

            {/* Anlık Ceza Göstergesi (Rıfkı, Kız, Erkek, Kupa yiyenler) */}
            {livePenalty && (
              <span className="font-black text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded-full border border-rose-500/60 animate-pulse text-[9px] shadow">
                {livePenalty}
              </span>
            )}

            {/* O el içinde aldığı löve / el sayısı */}
            {(player.tricksWon !== undefined && player.tricksWon > 0) && (
              <span className="font-bold text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-600/40" title="Aldığı El Sayısı">
                ✋ {player.tricksWon}
              </span>
            )}

            {/* Elinde kalan kart sayısı */}
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
