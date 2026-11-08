import React, { useState } from 'react';
import Card from './Card';
import { Palette, Layers, SlidersHorizontal, ArrowUpCircle } from 'lucide-react';

export default function Hand({
  cards = [],
  isSpectator = false,
  onCardSelect,
  selectedCardId = null,
  isFourColor = false,
  onToggleFourColor,
  playableCardIds = null,
  isMyTurn = false,
  onPlayCard,
}) {
  const [viewMode, setViewMode] = useState('twoRows');

  if (isSpectator) {
    return (
      <div className="w-full py-4 px-3 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md border-t border-emerald-800/40 rounded-t-3xl shadow-2xl">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold bg-emerald-900/80 px-4 py-2 rounded-full border border-emerald-700/60 shadow">
          <span>👀</span>
          <span>Yancı Modu — Masadaki oyunu ve yerdeki kartları canlı izliyorsunuz.</span>
        </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full py-5 px-3 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md border-t border-emerald-800/40 rounded-t-3xl shadow-2xl">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold bg-amber-950/80 px-4 py-2.5 rounded-full border border-amber-500/50 animate-pulse shadow-lg">
          <span>🃏</span>
          <span>Kartlar dağıtılmayı bekliyor... ("Test Başlat" veya "Oyunu Başlat"a basınız)</span>
        </div>
      </div>
    );
  }

  const half = Math.ceil(cards.length / 2);
  const rowTop = cards.slice(0, half);
  const rowBottom = cards.slice(half);

  const handleCardInteraction = (card) => {
    if (!isMyTurn) {
      if (onCardSelect) onCardSelect(card);
      return;
    }

    const isPlayable = !playableCardIds || playableCardIds.includes(card.id);
    if (!isPlayable) return;

    if (selectedCardId === card.id) {
      if (onPlayCard) onPlayCard(card);
    } else {
      if (onCardSelect) onCardSelect(card);
    }
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const isSelectedPlayable = isMyTurn && selectedCard && (!playableCardIds || playableCardIds.includes(selectedCard.id));

  const renderCardRow = (cardList) => {
    return cardList.map((c, idx) => {
      const nextCard = cardList[idx + 1];
      const isLastInSuit = !nextCard || nextCard.suit !== c.suit;
      const isFirst = idx === 0;
      const isDisabled = isMyTurn && playableCardIds && !playableCardIds.includes(c.id);

      return (
        <div
          key={c.id}
          className={`transition-all duration-200 ${!isFirst ? '-ml-2.5 xs:-ml-3' : ''} ${isLastInSuit ? 'mr-3' : ''}`}
          style={{ zIndex: selectedCardId === c.id ? 30 : idx }}
        >
          <Card
            card={c}
            size="md"
            isSelected={selectedCardId === c.id}
            isFourColor={isFourColor}
            disabled={isDisabled}
            onClick={() => handleCardInteraction(c)}
          />
        </div>
      );
    });
  };

  return (
    <div className="w-full bg-emerald-950/90 backdrop-blur-md border-t border-emerald-600/50 pt-1.5 pb-2.5 px-1.5 relative rounded-t-3xl shadow-[0_-12px_30px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="flex items-center justify-between px-3 pb-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-black text-white tracking-wide">
            Eliniz ({cards.length} Kart)
          </span>

          {isMyTurn && (
            <span className="text-[10px] font-black text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/50 animate-bounce">
              SIRA SİZDE!
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isSelectedPlayable && (
            <button
              onClick={() => onPlayCard && onPlayCard(selectedCard)}
              className="flex items-center gap-1 text-[11px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 px-3 py-1 rounded-full shadow-lg border border-amber-200 animate-pulse active:scale-95 transition"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Kartı At ({selectedCard.label}{selectedCard.suitSymbol})</span>
            </button>
          )}

          <button
            onClick={onToggleFourColor}
            title="4 Renk Deste Modu"
            className={`
              flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition active:scale-95 shadow
              ${isFourColor
                ? 'bg-gradient-to-r from-rose-600 via-blue-600 to-emerald-600 text-white border-white/60'
                : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border-emerald-700/60'}
            `}
          >
            <Palette className="w-3 h-3" />
            <span className="hidden xs:inline">{isFourColor ? '4 Renk: Açık' : '4 Renk'}</span>
          </button>

          <button
            onClick={() => setViewMode(v => v === 'twoRows' ? 'fan' : 'twoRows')}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-200 bg-emerald-900/80 hover:bg-emerald-800 px-2 py-0.5 rounded-full border border-emerald-700/60 active:scale-95 transition"
          >
            {viewMode === 'twoRows' ? (
              <>
                <SlidersHorizontal className="w-3 h-3 text-amber-300" />
                <span>2 Sıra</span>
              </>
            ) : (
              <>
                <Layers className="w-3 h-3 text-amber-300" />
                <span>Yelpaze</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden pt-4 pb-1">
        {viewMode === 'twoRows' ? (
          <div className="flex flex-col gap-3 items-center justify-center w-full">
            <div className="flex items-center justify-center w-full overflow-visible px-2">
              {renderCardRow(rowTop)}
            </div>
            <div className="flex items-center justify-center w-full overflow-visible px-2">
              {renderCardRow(rowBottom)}
            </div>
          </div>
        ) : (
          <div className="relative flex justify-center items-end h-24 w-full px-2 overflow-visible pb-1">
            {cards.map((c, idx) => {
              const total = cards.length;
              const mid = (total - 1) / 2;
              const offset = idx - mid;
              const rot = offset * 3;
              const yOffset = Math.abs(offset) * 1.8;
              const isDisabled = isMyTurn && playableCardIds && !playableCardIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  className="transition-transform duration-200"
                  style={{
                    marginLeft: idx === 0 ? 0 : '-18px',
                    transform: `rotate(${rot}deg) translateY(${yOffset}px)`,
                    zIndex: selectedCardId === c.id ? 30 : idx,
                  }}
                >
                  <Card
                    card={c}
                    size="md"
                    isSelected={selectedCardId === c.id}
                    isFourColor={isFourColor}
                    disabled={isDisabled}
                    onClick={() => handleCardInteraction(c)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
