import React, { useState } from 'react';
import { AlertTriangle, Swords } from 'lucide-react';
import { CONTRACT_DEFINITIONS } from '../utils/rules';

export default function ContractModal({
  isOpen,
  gameRound = 1,
  playerState = {},
  contractsRecord = {},
  onSelectContract,
  isMyTurn = false,
  selectorPlayerName = '',
}) {
  if (!isOpen) return null;

  const isFirstFourRounds = gameRound <= 4;
  const penaltiesLeft = playerState?.penaltiesLeft ?? 3;
  const trumpsLeft = playerState?.trumpsLeft ?? 2;

  const penaltyContracts = CONTRACT_DEFINITIONS.filter(c => c.type === 'penalty');

  const trumpSuits = [
    { id: 'S', symbol: '♠', name: 'Maça', color: 'text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300' },
    { id: 'H', symbol: '♥', name: 'Kupa', color: 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-300' },
    { id: 'D', symbol: '♦', name: 'Karo', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-300' },
    { id: 'C', symbol: '♣', name: 'Sinek', color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300' },
  ];

  if (!isMyTurn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-pop-in select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-2xl animate-pulse">
            👑
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/40">
              El {gameRound} / 20
            </span>
            <h3 className="text-lg font-black text-white mt-2">
              Kontrat Seçiliyor
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Sıra <strong className="text-amber-300">{selectorPlayerName}</strong> oyuncusunda, kontrat seçmesi bekleniyor...
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Oyun başlamak üzere</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-pop-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-3 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 text-center relative">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">👑</span>
            <h2 className="text-base font-black text-white tracking-wide">
              Kontrat Seçin (Sıra Sizde!)
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1 text-[11px]">
            <span className="text-amber-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-700">
              El: {gameRound}/20
            </span>
            <span className="text-rose-300 font-bold bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-700/50">
              Kalan Cezanız: {penaltiesLeft}/3
            </span>
            <span className="text-sky-300 font-bold bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-700/50">
              Kalan Kozunuz: {trumpsLeft}/2
            </span>
          </div>
        </div>

        <div className="p-3.5 space-y-3.5 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Ceza Oyunları (Kalan Hak: {penaltiesLeft})</span>
              </span>
              {penaltiesLeft <= 0 && (
                <span className="text-[10px] text-rose-400 font-bold">Hakkınız Bitti</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {penaltyContracts.map((item) => {
                const rec = contractsRecord[item.id] || { played: 0, total: 2 };
                const remainingInPool = (item.total - (rec.played || 0));
                const isPoolEmpty = remainingInPool <= 0;
                const isDisabled = penaltiesLeft <= 0 || isPoolEmpty;

                return (
                  <button
                    key={item.id}
                    disabled={isDisabled}
                    onClick={() => {
                      onSelectContract({
                        type: 'penalty',
                        id: item.id,
                        name: item.name,
                        trumpSuit: null,
                      });
                    }}
                    className={`
                      p-2.5 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between
                      ${isDisabled
                        ? 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-40 cursor-not-allowed'
                        : 'bg-slate-800/80 hover:bg-rose-950/40 border-slate-700/70 hover:border-rose-400/60 active:scale-97 cursor-pointer shadow-md'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-[10px] font-black text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded-full border border-rose-800/50">
                        {remainingInPool} kaldı
                      </span>
                    </div>

                    <div className="mt-1">
                      <div className="text-xs font-black text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.pts}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-sky-400" />
                <span>Koz Oyunları (+50 P / El)</span>
              </span>
              <span className="text-[10px] text-sky-300 font-bold">
                Kalan Hak: {trumpsLeft}/2
              </span>
            </div>

            {isFirstFourRounds ? (
              <div className="p-2.5 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-center space-y-1">
                <div className="text-xs font-black text-amber-300 flex items-center justify-center gap-1">
                  <span>🔒</span>
                  <span>ÖZEL KURAL: İlk 4 El Koz Yasak!</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  Oyunun ilk 4 elinde (El 1-4) herkes mecburi Ceza oynamak zorundadır.
                </p>
              </div>
            ) : trumpsLeft <= 0 ? (
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                Koz hakkınız (2/2) tükendi.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300">
                  Koz rengini seçin ve oyunu başlatın:
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {trumpSuits.map((ts) => (
                    <button
                      key={ts.id}
                      onClick={() => {
                        onSelectContract({
                          type: 'trump',
                          id: 'koz',
                          name: `Koz: ${ts.symbol} ${ts.name}`,
                          trumpSuit: ts.id,
                        });
                      }}
                      className={`
                        p-2.5 rounded-2xl border text-center transition-all duration-200 active:scale-95 cursor-pointer shadow-md flex flex-col items-center justify-center
                        ${ts.color}
                      `}
                    >
                      <span className="text-2xl font-bold leading-none">{ts.symbol}</span>
                      <span className="text-[10px] font-black mt-1 leading-tight">{ts.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
