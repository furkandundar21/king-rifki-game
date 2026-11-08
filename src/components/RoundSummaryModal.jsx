import React from 'react';
import { Trophy, ArrowRight, Award } from 'lucide-react';
import { SEAT_ORDER } from '../utils/rules';

export default function RoundSummaryModal({
  isOpen,
  gameRound = 1,
  contract = null,
  roundScores = {},
  roundDetails = {},
  seats = {},
  nextSelectorName = '',
  onNextRound,
  earlyFinishReason = null,
}) {
  if (!isOpen) return null;

  const rankedPlayers = SEAT_ORDER.map(seatKey => {
    const player = seats[seatKey];
    return {
      seatKey,
      name: player?.name || seatKey,
      totalScore: player?.totalScore || 0,
      roundScore: roundScores[seatKey] || 0,
      detail: roundDetails[seatKey] || '',
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-pop-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-3.5 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 text-center relative">
          <span className="text-2xl animate-bounce">👑</span>
          <h2 className="text-base font-black text-white tracking-wide mt-1">
            El {gameRound} Tamamlandı!
          </h2>
          <div className="text-xs text-amber-300 font-bold mt-0.5">
            Kontrat: <strong className="text-white">{contract?.name || 'Kontrat'}</strong>
          </div>

          {earlyFinishReason && (
            <div className="mt-2 text-xs font-black text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-xl border border-rose-600/50">
              {earlyFinishReason}
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Bu Elin Skorları</span>
            </h3>

            <div className="space-y-1.5">
              {rankedPlayers.map((p) => {
                const isPositive = p.roundScore > 0;
                const isNegative = p.roundScore < 0;

                return (
                  <div
                    key={p.seatKey}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-black text-white truncate max-w-[130px]">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.detail || 'Temiz'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-black px-2 py-0.5 rounded-full border ${
                          isPositive
                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                            : isNegative
                            ? 'text-rose-400 bg-rose-950/60 border-rose-500/40'
                            : 'text-slate-300 bg-slate-900 border-slate-700'
                        }`}
                      >
                        {isPositive ? `+${p.roundScore}` : p.roundScore} P
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Genel Puan Tablosu</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {rankedPlayers.map((p, idx) => {
                const medals = ['🥇', '🥈', '🥉', '4.'];
                const isTotalPos = p.totalScore > 0;
                const isTotalNeg = p.totalScore < 0;

                return (
                  <div
                    key={p.seatKey}
                    className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{medals[idx]}</span>
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
                        {p.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black ${
                        isTotalPos ? 'text-emerald-400' : isTotalNeg ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {p.totalScore} P
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 text-center">
            <span className="text-[11px] text-emerald-300 font-medium">
              Sıradaki El ({gameRound < 20 ? gameRound + 1 : 20}/20) Kontrat Seçimi:{' '}
              <strong className="text-amber-300 font-bold">{nextSelectorName}</strong>
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onNextRound}
            className="w-full py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-pulse-glow"
          >
            <span>{gameRound >= 20 ? 'Oyun Sonucunu Gör 🏆' : 'Sonraki Ele Geç ve Kartları Dağıt'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
