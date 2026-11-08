import React, { useState, useEffect } from 'react';
import { Crown, AlertTriangle, Swords, Shield, Sparkles, Check, Clock } from 'lucide-react';
import { CONTRACT_DEFINITIONS } from '../utils/rules';

export default function ContractModal({
  isOpen,
  gameRound = 1,
  playerState = {}, // { penaltiesLeft: 3, trumpsLeft: 2 }
  contractsRecord = {},
  onSelectContract,
  isMyTurn = false,
  selectorPlayerName = '',
  secondsLeft = 30,
  karo2Seat = null,
}) {
  const [selectedTrumpSuit, setSelectedTrumpSuit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal açıldığında veya yeni el başladığında tıklama kilidini sıfırla
  useEffect(() => {
    setIsSubmitting(false);
  }, [isOpen, gameRound]);

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

  // Çift tıklamayı ve çift düşmeyi önleyen korumalı seçim fonksiyonu
  const handleChoose = (contract) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (onSelectContract) {
      onSelectContract(contract);
    }
  };

  // Sıra bende değilse (Diğer oyuncular beklerken görünen şık bildirim)
  if (!isMyTurn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-pop-in select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-2xl animate-pulse">
            👑
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/40">
                El {gameRound} / 20
              </span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                secondsLeft <= 10
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                  : 'bg-slate-950 text-amber-300 border-amber-600/40'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{secondsLeft}s</span>
              </span>
            </div>

            <h3 className="text-lg font-black text-white mt-1">
              Kontrat Seçiliyor
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Sıra <strong className="text-amber-300">{selectorPlayerName}</strong> oyuncusunda, kontrat seçmesi bekleniyor...
            </p>

            {gameRound === 1 && (
              <div className="mt-2.5 text-[11px] font-bold text-rose-400 bg-rose-950/50 border border-rose-800/40 px-2.5 py-1 rounded-xl">
                ♦ 1. El Kuralı: Karo 2 {selectorPlayerName}'de olduğu için ilk oyunu o seçiyor.
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{secondsLeft <= 5 ? 'Süre bitmek üzere (Otomatik seçim yapılacak)...' : 'Oyun başlamak üzere'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Sıra bende: Kontrat Seçim Paneli
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-pop-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Üst Başlık ve Geri Sayım Sayacı */}
        <div className="p-3 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 text-center relative">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">👑</span>
              <h2 className="text-base font-black text-white tracking-wide">
                Kontrat Seçin!
              </h2>
            </div>

            {/* 30 Saniye Sayacı */}
            <div
              className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border transition-all duration-300 ${
                secondsLeft <= 10
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                  : 'bg-slate-950 text-amber-300 border-amber-500/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{secondsLeft} sn</span>
            </div>
          </div>

          {/* Karo 2 Hatırlatması */}
          {gameRound === 1 && (
            <div className="mt-1 text-[11px] font-bold text-rose-300 bg-rose-950/70 border border-rose-600/40 rounded-xl px-2 py-0.5">
              ♦ Karo 2 (♦2) sizde! 1. oyunun kontratını siz belirliyorsunuz.
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px]">
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

        {/* İçerik */}
        <div className="p-3.5 space-y-3.5 overflow-y-auto">
          
          {/* 1. CEZALAR BÖLÜMÜ */}
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
                const isDisabled = penaltiesLeft <= 0 || isPoolEmpty || isSubmitting;

                return (
                  <button
                    key={item.id}
                    disabled={isDisabled}
                    onClick={() => {
                      handleChoose({
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

          {/* 2. KOZLAR BÖLÜMÜ */}
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

            {/* ÖZEL KURAL 1: İlk 4 El Koz Yasağı Uyarısı */}
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
                      disabled={isSubmitting}
                      onClick={() => {
                        handleChoose({
                          type: 'trump',
                          id: 'koz',
                          name: `Koz: ${ts.symbol} ${ts.name}`,
                          trumpSuit: ts.id,
                        });
                      }}
                      className={`
                        p-2.5 rounded-2xl border text-center transition-all duration-200 active:scale-95 cursor-pointer shadow-md flex flex-col items-center justify-center
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
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
