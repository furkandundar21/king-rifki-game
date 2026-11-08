import React from 'react';
import { X, Award, AlertTriangle, FileSpreadsheet, RotateCcw, History } from 'lucide-react';
import { SEAT_ORDER, CONTRACT_DEFINITIONS } from '../utils/rules';

export default function ScoreModal({
  isOpen,
  onClose,
  seats = {},
  contractsRecord = {},
  roundHistory = [],
  onOpenSwapModal,
}) {
  if (!isOpen) return null;

  const seatLabels = { south: 'Güney', east: 'Doğu', north: 'Kuzey', west: 'Batı' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-pop-in select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-800/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-400 text-slate-950 font-black">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">Yazboz (Skor Defteri)</h2>
              <p className="text-[10px] text-emerald-400 font-medium">Toplam 20 El (12 Ceza, 8 Koz)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Toplam Skorlar</span>
              </h3>

              {onOpenSwapModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSwapModal();
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 px-2.5 py-1 rounded-full border border-indigo-700/60 active:scale-95 transition"
                >
                  <RotateCcw className="w-3 h-3 text-amber-300" />
                  <span>Yancı ile Yer Değiş</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SEAT_ORDER.map((key) => {
                const p = seats[key];
                const score = p?.totalScore || 0;
                const isPos = score > 0;
                const isNeg = score < 0;

                return (
                  <div
                    key={key}
                    className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-emerald-400">
                        {seatLabels[key]}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {p?.penaltiesLeft ?? 3}C | {p?.trumpsLeft ?? 2}K
                      </span>
                    </div>

                    <div className="font-extrabold text-xs text-white truncate my-1">
                      {p ? p.name : <span className="text-slate-500 font-normal italic">Boş Koltuk</span>}
                    </div>

                    <div className="text-center py-1 mt-1 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span
                        className={`text-lg font-black tracking-tight ${
                          isPos ? 'text-emerald-400' : isNeg ? 'text-rose-500' : 'text-slate-300'
                        }`}
                      >
                        {isPos ? `+${score}` : score} P
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oynanan Eller Geçmişi ({roundHistory.length}/20)</span>
            </h3>

            {roundHistory.length === 0 ? (
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500 italic">
                Henüz el tamamlanmadı. İlk el bittiğinde skorlar buraya işlenecektir.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2">El</th>
                      <th className="p-2">Kontrat</th>
                      {SEAT_ORDER.map(s => (
                        <th key={s} className="p-2 text-center truncate max-w-[50px]">
                          {seats[s]?.name?.slice(0, 5) || seatLabels[s]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {roundHistory.map((rh, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-bold text-amber-400">{rh.roundNumber}</td>
                        <td className="p-2 text-[11px] text-white font-medium truncate max-w-[80px]">
                          {rh.contractName}
                        </td>
                        {SEAT_ORDER.map(s => {
                          const sc = rh.scores?.[s] || 0;
                          return (
                            <td
                              key={s}
                              className={`p-2 text-center font-bold text-[11px] ${
                                sc > 0 ? 'text-emerald-400' : sc < 0 ? 'text-rose-400' : 'text-slate-500'
                              }`}
                            >
                              {sc > 0 ? `+${sc}` : sc}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Kalan Kontrat Havuzu</span>
            </h3>

            <div className="space-y-1.5">
              {CONTRACT_DEFINITIONS.map((item) => {
                const rec = contractsRecord[item.id] || { played: 0, total: item.total };
                const remaining = (item.total - (rec.played || 0));
                const isCompleted = remaining <= 0;

                return (
                  <div
                    key={item.id}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-xl text-xs border
                      ${item.type === 'trump' ? 'bg-sky-950/40 border-sky-800/40' : 'bg-slate-800/40 border-slate-700/40'}
                      ${isCompleted ? 'opacity-40 line-through' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <div>
                        <div className="font-bold text-slate-100">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.pts}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {rec.played || 0}/{item.total}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          item.type === 'trump'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {remaining} kaldı
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 transition"
          >
            Kapat ve Masaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
