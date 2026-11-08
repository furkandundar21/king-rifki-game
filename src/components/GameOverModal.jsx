import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, RotateCcw } from 'lucide-react';
import { SEAT_ORDER } from '../utils/rules';

export default function GameOverModal({
  isOpen,
  seats = {},
  onRestartGame,
}) {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rankedPlayers = SEAT_ORDER.map((seatKey) => {
    const p = seats[seatKey];
    return {
      seatKey,
      name: p?.name || seatKey,
      totalScore: p?.totalScore || 0,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const champion = rankedPlayers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/90 backdrop-blur-md animate-pop-in select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-5 space-y-4 text-center">
        <div className="pt-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/40 animate-bounce">
            <Crown className="w-10 h-10 drop-shadow" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-2">
            20 EL BİTTİ — OYUNUN KRALI!
          </h1>
          <div className="text-base font-black text-amber-300 mt-0.5">
            👑 {champion?.name} ({champion?.totalScore > 0 ? `+${champion.totalScore}` : champion?.totalScore} Puan)
          </div>
        </div>

        <div className="space-y-2 py-1">
          {rankedPlayers.map((p, idx) => {
            const medals = ['🥇 1.', '🥈 2.', '🥉 3.', '4.'];
            const isPos = p.totalScore > 0;
            const isNeg = p.totalScore < 0;

            return (
              <div
                key={p.seatKey}
                className={`
                  flex items-center justify-between p-3 rounded-2xl border
                  ${idx === 0 ? 'bg-amber-950/50 border-amber-400/80 shadow-lg' : 'bg-slate-800/60 border-slate-700/60'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-amber-400">{medals[idx]}</span>
                  <span className="text-xs font-bold text-white">{p.name}</span>
                </div>

                <span
                  className={`text-sm font-black ${
                    isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {isPos ? `+${p.totalScore}` : p.totalScore} P
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            onClick={onRestartGame}
            className="w-full py-3.5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-pulse-glow"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Yeni Bir King Maçı Başlat (20 El)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
