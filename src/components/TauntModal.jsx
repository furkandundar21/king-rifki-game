import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { playTauntSound } from '../utils/audio';

const QUICK_TAUNTS = [
  { text: 'Ağlama! 😭', color: 'from-amber-500/20 to-orange-500/20' },
  { text: 'Rıfkı sana çok yakıştı 👑', color: 'from-yellow-500/20 to-amber-500/20' },
  { text: 'Kağıtları kim dağıttı?! 🤬', color: 'from-red-500/20 to-rose-500/20' },
  { text: 'Yancı çay getir! ☕', color: 'from-emerald-500/20 to-teal-500/20' },
  { text: 'Koz çek de görelim 😎', color: 'from-blue-500/20 to-indigo-500/20' },
  { text: 'Zorlama, yiyeceksin 😂', color: 'from-purple-500/20 to-pink-500/20' },
];

export default function TauntModal({
  isOpen,
  onClose,
  onSendTaunt,
}) {
  const [customText, setCustomText] = useState('');

  if (!isOpen) return null;

  const handleSend = (text) => {
    if (!text || !text.trim()) return;
    playTauntSound();
    onSendTaunt(text.trim());
    setCustomText('');
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    handleSend(customText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-pop-in">
      <div className="w-full sm:max-w-sm bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 space-y-3 pb-6 sm:pb-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <span className="font-black text-sm text-amber-300">Masaya Laf At!</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {QUICK_TAUNTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.text)}
              className="p-2.5 rounded-2xl bg-gradient-to-r hover:scale-102 active:scale-95 border border-slate-700/60 hover:border-amber-400/60 text-left text-xs font-bold text-slate-100 shadow transition flex items-center justify-between"
            >
              <span>{item.text}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Özel laf at / şaka yaz..."
            maxLength={60}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!customText.trim()}
            className="p-2 rounded-xl bg-amber-500 disabled:opacity-40 text-slate-950 font-bold hover:bg-amber-400 transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
