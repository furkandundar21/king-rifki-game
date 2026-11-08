import React, { useState } from 'react';
import { Users, Eye, Play, Sparkles, Copy, Crown, Bot } from 'lucide-react';
import { playStartGameSound } from '../utils/audio';

export default function Lobby({
  roomPin,
  setRoomPin,
  playerName,
  setPlayerName,
  currentSeat,
  seats = {},
  spectator = null,
  playerId,
  onSelectSeat,
  onStartGame,
  onFillBotsAndStart,
  onClearSeats,
  isConnected = false,
}) {
  const [copied, setCopied] = useState(false);

  const seatKeys = ['south', 'east', 'north', 'west'];
  const filledSeatsCount = seatKeys.filter((k) => seats[k] !== null).length;
  const canStart = filledSeatsCount === 4;

  const seatConfig = [
    { key: 'south', name: 'Güney (South)', icon: '⬇️' },
    { key: 'east',  name: 'Doğu (East)',   icon: '➡️' },
    { key: 'north', name: 'Kuzey (North)',  icon: '⬆️' },
    { key: 'west',  name: 'Batı (West)',   icon: '⬅️' },
  ];

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-3.5 bg-slate-950 text-slate-100 overflow-y-auto max-w-md mx-auto">
      <div className="text-center pt-1 pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 mb-1">
          <Crown className="w-7 h-7 drop-shadow" />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
          <span>KING</span>
          <span className="text-amber-400 font-extrabold text-xs bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
            RIFKI
          </span>
        </h1>
        <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
          5 Kişilik Bulut Masası (4 Oyuncu + 1 Yancı)
        </p>
      </div>

      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/50 p-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <Bot className="w-4 h-4 text-amber-400" />
            <span>Tek Başına Test Etmek İçin:</span>
          </div>
          <span className="text-[10px] text-amber-400/80 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-700/50">
            Aşama 1 Demo
          </span>
        </div>

        <button
          onClick={onFillBotsAndStart}
          className="w-full py-2.5 px-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse-glow"
        >
          <Sparkles className="w-4 h-4" />
          <span>🤖 Boş Koltukları Botla Doldur ve Başlat (Test)</span>
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
              Oda PIN Kodu (Uzaktan Ortak PIN)
            </label>
            <input
              type="text"
              value={roomPin}
              onChange={(e) => setRoomPin(e.target.value)}
              placeholder="1923"
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-center text-sm font-black text-amber-300 tracking-widest focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
              Oyuncu Adınız
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Adınızı yazın..."
              maxLength={14}
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[10px]">
          <span className="text-slate-400">
            Arkadaşlarına gönder: <strong className="text-amber-400 font-mono">PIN: {roomPin || '1923'}</strong>
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-700/50 active:scale-95 transition"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'Kopyalandı!' : 'Linki Kopyala'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5 my-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Masa Koltukları ({filledSeatsCount}/4)</span>
          </span>
          <span className="text-[9px] text-slate-400">
            Koltuk seçmek için dokunun
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {seatConfig.map((seat) => {
            const occupant = seats[seat.key];
            const isMe = occupant && occupant.playerId === playerId;
            const isSelectedByMe = currentSeat === seat.key;

            return (
              <button
                key={seat.key}
                onClick={() => onSelectSeat(seat.key)}
                className={`
                  p-2.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-18
                  ${isSelectedByMe
                    ? 'bg-emerald-800/40 border-2 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-emerald-950'
                    : occupant
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 active:scale-98 cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <span>{seat.icon}</span>
                    <span>{seat.name}</span>
                  </span>

                  {isMe ? (
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      SEN
                    </span>
                  ) : occupant ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ) : (
                    <span className="text-[8px] font-bold text-emerald-500 bg-emerald-950/60 px-1 py-0.2 rounded-full border border-emerald-700/40">
                      BOŞ
                    </span>
                  )}
                </div>

                <div className="mt-0.5">
                  {occupant ? (
                    <div className="text-[11px] font-black text-white truncate flex items-center gap-1">
                      <span className="text-emerald-400">👤</span>
                      <span>{occupant.name}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-medium text-slate-500 italic">
                      Dokun ve Otur
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div>
          {(() => {
            const isSpectatorMe = spectator && spectator.playerId === playerId;
            const isSpectatorSelected = currentSeat === 'spectator';

            return (
              <button
                onClick={() => onSelectSeat('spectator')}
                className={`
                  w-full p-2.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between
                  ${isSpectatorSelected
                    ? 'bg-indigo-950/60 border-2 border-indigo-400 ring-2 ring-indigo-400/30'
                    : spectator
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 active:scale-98'}
                `}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-900/60 border border-indigo-500/40 flex items-center justify-center text-base">
                    👀
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-indigo-300">
                        Yancı (İzleyici) Koltuğu
                      </span>
                      {isSpectatorMe && (
                        <span className="bg-indigo-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full">
                          SEN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {spectator ? (
                        <span className="text-white font-bold">Oturuyor: {spectator.name}</span>
                      ) : (
                        <span>5. kişi maçı izler, laf atar, çay söyler ☕</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {spectator ? (
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800">
                      DOLU
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                      Yancı Ol
                    </span>
                  )}
                </div>
              </button>
            );
          })()}
        </div>
      </div>

      <div className="pt-1 pb-1 space-y-1.5">
        <button
          onClick={() => {
            playStartGameSound();
            onStartGame();
          }}
          disabled={!canStart}
          className={`
            w-full py-3 px-4 rounded-2xl font-black text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-xl
            ${canStart
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 shadow-emerald-500/30 scale-102 active:scale-98 cursor-pointer'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'}
          `}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>
            {canStart
              ? '🎮 4 Kişiyle Oyunu Başlat'
              : `4 Oyuncu Bekleniyor (${filledSeatsCount}/4)`}
          </span>
        </button>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onClearSeats}
            className="text-[10px] font-medium text-slate-500 hover:text-rose-400 transition"
          >
            🧹 Masadaki Koltukları Sıfırla
          </button>
        </div>
      </div>
    </div>
  );
}
