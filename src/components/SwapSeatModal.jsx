import React from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { SEAT_ORDER } from '../utils/rules';

export default function SwapSeatModal({
  isOpen,
  onClose,
  seats = {},
  spectator = null,
  onSwapWithSpectator,
}) {
  if (!isOpen) return null;

  const seatLabels = { south: 'Güney', east: 'Doğu', north: 'Kuzey', west: 'Batı' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-pop-in select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Yancı Rotasyonu</h2>
              <p className="text-[10px] text-indigo-300">5. Arkadaşı Masaya Al</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2.5 rounded-2xl bg-indigo-950/50 border border-indigo-700/40 text-center">
          <span className="text-xs text-indigo-200">
            Mevcut Yancı:{' '}
            <strong className="text-amber-300 font-bold">
              {spectator?.name || 'Yancı Koltuğu Boş'}
            </strong>
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Yancı ile yer değiştirmek istediğiniz masadaki koltuğu seçin:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SEAT_ORDER.map((s) => {
            const player = seats[s];
            return (
              <button
                key={s}
                disabled={!spectator}
                onClick={() => {
                  onSwapWithSpectator(s);
                  onClose();
                }}
                className={`
                  p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between
                  ${spectator
                    ? 'bg-slate-800/80 hover:bg-indigo-950/40 border-slate-700 hover:border-indigo-400/60 cursor-pointer shadow-md'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'}
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-emerald-400">
                    {seatLabels[s]}
                  </span>
                  <span className="text-xs">🔄</span>
                </div>
                <div className="text-xs font-black text-white truncate mt-1">
                  {player?.name || 'Boş'}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
