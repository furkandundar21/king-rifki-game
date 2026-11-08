import React, { useState, useMemo } from 'react';
import PlayerSeat from './PlayerSeat';
import Hand from './Hand';
import Card from './Card';
import ScoreModal from './ScoreModal';
import TauntModal from './TauntModal';
import ContractModal from './ContractModal';
import RoundSummaryModal from './RoundSummaryModal';
import GameOverModal from './GameOverModal';
import SwapSeatModal from './SwapSeatModal';
import { getPlayableCards, getNextSeat } from '../utils/rules';
import { getLivePenaltyDisplay } from '../utils/scoring';
import {
  FileSpreadsheet,
  RotateCcw,
  Crown,
  Eye,
  ArrowRightLeft,
  Sparkles,
  Swords,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { playCardClickSound, playDealSound } from '../utils/audio';

export default function Table({
  roomState,
  mySeat,
  myHand = [],
  myPlayerId,
  onSendTaunt,
  onResetToLobby,
  activeTaunt,
  onFillBotsAndStart,
  isFourColor = false,
  onToggleFourColor,
  onSelectContract,
  onPlayCard,
  onNextRound,
  onSwapWithSpectator,
}) {
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [isTauntOpen, setIsTauntOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [now, setNow] = useState(Date.now());

  // 250ms aralıklarla canlı zaman sayacı
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const {
    seats = {},
    spectator = null,
    gameRound = 1,
    totalRounds = 20,
    turnSeat = 'south',
    contractSelectorSeat = 'south',
    currentContract = null,
    activeContract = 'Seçiliyor...',
    contractsRecord = {},
    trickCards = [],
    trickHistory = [],
    roundHistory = [],
    lastRoundResult = null,
    earlyFinishReason = null,
    trickNumber = 1,
    isHeartBroken = false,
    isTrumpBroken = false,
    status = 'playing',
    lastTrickWinner = null,
    turnDeadline = null,
    karo2Seat = null,
  } = roomState || {};

  const isSpectator = mySeat === 'spectator';
  const isMyTurn = !isSpectator && turnSeat === mySeat && status === 'playing';
  const isContractSelecting = status === 'selecting_contract';
  const isMyContractTurn = !isSpectator && contractSelectorSeat === mySeat && isContractSelecting;

  // 30 Saniye Hamle Sayacı
  const secondsLeft = useMemo(() => {
    if (!turnDeadline) return 30;
    if (status !== 'playing' && status !== 'selecting_contract') return 30;
    const diff = Math.ceil((turnDeadline - now) / 1000);
    return Math.max(0, Math.min(30, diff));
  }, [turnDeadline, now, status]);

  // GÖRECELİ PERSPEKTİF HESAPLAMA (Saat yönünün tersine - sağa doğru)
  // Güney (0 - Ben) -> Doğu (1 - Sağ) -> Kuzey (2 - Karşı) -> Batı (3 - Sol)
  const seatOrder = ['south', 'east', 'north', 'west'];
  const getRelativeSeats = () => {
    let myIndex = seatOrder.indexOf(mySeat);
    if (myIndex === -1) myIndex = 0;

    return {
      bottomSeatKey: seatOrder[myIndex],
      rightSeatKey:  seatOrder[(myIndex + 1) % 4], // Sağımdaki oyuncu
      topSeatKey:    seatOrder[(myIndex + 2) % 4], // Karşımdaki oyuncu
      leftSeatKey:   seatOrder[(myIndex + 3) % 4], // Solumdaki oyuncu
    };
  };

  const { bottomSeatKey, rightSeatKey, topSeatKey, leftSeatKey } = getRelativeSeats();

  const getPlayerWithHandCount = (player, seatKey) => {
    if (!player) return null;
    const isPlaying = status === 'playing' || status === 'trick_won' || status === 'selecting_contract';
    const count = isPlaying ? (player.handCount ?? roomState?.hands?.[seatKey]?.length ?? 13) : 0;
    return { ...player, handCount: count };
  };

  const bottomPlayer = getPlayerWithHandCount(seats[bottomSeatKey], bottomSeatKey);
  const rightPlayer  = getPlayerWithHandCount(seats[rightSeatKey], rightSeatKey);
  const topPlayer    = getPlayerWithHandCount(seats[topSeatKey], topSeatKey);
  const leftPlayer   = getPlayerWithHandCount(seats[leftSeatKey], leftSeatKey);

  const turnPlayerName = seats[turnSeat]?.name || 'Bilinmiyor';
  const selectorPlayerName = seats[contractSelectorSeat]?.name || 'Bilinmiyor';
  const nextSelectorSeat = getNextSeat(contractSelectorSeat);
  const nextSelectorName = seats[nextSelectorSeat]?.name || nextSelectorSeat;

  // Anlık Ceza Göstergeleri (Kız, Erkek, Kupa, Rıfkı)
  const livePenalties = useMemo(() => {
    return getLivePenaltyDisplay({
      contract: currentContract,
      trickHistory,
    });
  }, [currentContract, trickHistory]);

  // Oyuncunun oynayabileceği geçerli kartlar (Rules Motoru)
  const playableCardIds = useMemo(() => {
    if (!isMyTurn || !currentContract) return null;
    return getPlayableCards({
      hand: myHand,
      trickCards,
      contract: currentContract,
      isHeartBroken,
      isTrumpBroken,
    });
  }, [isMyTurn, myHand, trickCards, currentContract, isHeartBroken, isTrumpBroken]);

  // Kart Seçme
  const handleCardClick = (card) => {
    setSelectedCardId(prev => (prev === card.id ? null : card.id));
  };

  // Kart Oynama
  const handleCardPlay = (card) => {
    if (!isMyTurn || status !== 'playing') return;
    playCardClickSound();
    setSelectedCardId(null);
    if (onPlayCard) {
      onPlayCard(card);
    }
  };

  // Yerdeki kartları koltuklara göre bul
  const getTrickCardForSeat = (seatKey) => {
    return trickCards.find(tc => tc.seat === seatKey);
  };

  const bottomTrickCard = getTrickCardForSeat(bottomSeatKey);
  const rightTrickCard  = getTrickCardForSeat(rightSeatKey);
  const topTrickCard    = getTrickCardForSeat(topSeatKey);
  const leftTrickCard   = getTrickCardForSeat(leftSeatKey);

  return (
    <div className="relative w-full h-full flex flex-col justify-between felt-table felt-pattern overflow-hidden select-none">
      
      {/* 1. ÜST BAR (BİLGİ & KONTROLLER) */}
      <div className="w-full bg-slate-950/85 backdrop-blur-md border-b border-emerald-600/30 px-3 py-2 z-30 flex items-center justify-between shadow-lg">
        
        {/* Sol Taraf: Oyun Bilgileri */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/40">
              El: {gameRound}/{totalRounds}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-700/40">
              Löve: {trickNumber}/13
            </span>

            {/* 30 Saniye Hamle Sayacı */}
            {(status === 'playing' || status === 'selecting_contract') && (
              <div
                className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border transition-all duration-300 ${
                  secondsLeft <= 10
                    ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                    : 'bg-slate-900 text-amber-300 border-amber-500/40'
                }`}
                title="Kalan Hamle Süresi"
              >
                <Clock className="w-3 h-3" />
                <span>{secondsLeft}s</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200">
              <span className="text-emerald-400">Sıra:</span>
              <span className="text-white max-w-[85px] truncate">{turnPlayerName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-1">
            <span className="text-amber-400 font-bold">Kontrat:</span>
            <span className="font-extrabold text-white bg-slate-900 px-2 py-0.2 rounded border border-slate-700">
              {activeContract}
            </span>

            {/* 1. Elde Karo 2 Rozeti */}
            {gameRound === 1 && karo2Seat && (
              <span className="text-[9px] font-black text-rose-300 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-600/40 flex items-center gap-0.5">
                <span>♦ Karo 2:</span>
                <span className="text-white max-w-[70px] truncate">{seats[karo2Seat]?.name || karo2Seat}</span>
              </span>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Butonlar */}
        <div className="flex items-center gap-1.5">
          {/* Yancı Rotasyonu Butonu */}
          <button
            onClick={() => setIsSwapOpen(true)}
            title="Yancı ile Koltuk Değiştir"
            className="flex items-center gap-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 font-bold text-xs px-2 py-1.5 rounded-xl border border-indigo-600/50 shadow active:scale-95 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline text-[10px]">Yancı</span>
          </button>

          {/* Yazboz Butonu */}
          <button
            onClick={() => setIsScoreOpen(true)}
            className="flex items-center gap-1 bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-500/50 shadow active:scale-95 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
            <span>Yazboz</span>
          </button>

          {/* Lobi / Çıkış Butonu */}
          <button
            onClick={onResetToLobby}
            title="Lobiye Dön"
            className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-2 py-1.5 rounded-xl border border-slate-700 active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* YANCI ROZETİ */}
      {spectator && (
        <div className="absolute top-14 right-3 z-20">
          <div className="flex items-center gap-1.5 bg-indigo-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-indigo-500/50 shadow-md">
            <span className="text-xs">👀</span>
            <span className="text-[10px] font-bold text-indigo-200">
              Yancı: <strong className="text-white">{spectator.name}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 2. OYUN MASASI VE 4 OYUNCU YERLEŞİMİ */}
      <div className="relative flex-1 w-full flex flex-col justify-between items-center p-1.5 overflow-hidden">
        
        {/* ÜST OYUNCU (Karşımızdaki) */}
        <div className="pt-0.5 z-10">
          <PlayerSeat
            player={topPlayer}
            position="top"
            isTurn={turnSeat === topSeatKey}
            secondsLeft={secondsLeft}
            isKaro2={gameRound === 1 && karo2Seat === topSeatKey}
            taunt={activeTaunt && activeTaunt.senderSeat === topSeatKey ? activeTaunt : null}
            isSelf={!isSpectator && bottomSeatKey === topSeatKey}
            livePenalty={livePenalties[topSeatKey]}
          />
        </div>

        {/* ORTA BÖLÜM: SOL OYUNCU - LÖVE DAİRESİ - SAĞ OYUNCU */}
        <div className="w-full flex items-center justify-between px-1 my-auto">
          
          {/* SOL OYUNCU (Batı) */}
          <div className="z-10 -ml-1">
            <PlayerSeat
              player={leftPlayer}
              position="left"
              isTurn={turnSeat === leftSeatKey}
              secondsLeft={secondsLeft}
              isKaro2={gameRound === 1 && karo2Seat === leftSeatKey}
              taunt={activeTaunt && activeTaunt.senderSeat === leftSeatKey ? activeTaunt : null}
              isSelf={!isSpectator && bottomSeatKey === leftSeatKey}
              livePenalty={livePenalties[leftSeatKey]}
            />
          </div>

          {/* MASA MERKEZİ: 4 YÖNLÜ ATILAN KARTLAR DAİRESİ */}
          <div className="relative flex items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-950/40 backdrop-blur-xs w-48 h-48 xs:w-52 xs:h-52 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] mx-auto">
            
            {/* Arka Plan Kral Tacı */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-15">
              <Crown className="w-16 h-16 text-amber-300 mb-0.5" />
              <span className="font-serif font-black tracking-widest text-amber-200 text-xs">KING</span>
            </div>

            {/* 1. ÜST KART */}
            {topTrickCard && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center animate-pop-in z-10">
                <Card card={topTrickCard.card} size="sm" isFourColor={isFourColor} />
                <span className="text-[9px] font-bold text-slate-300 bg-slate-950/80 px-1 rounded -mt-1 shadow">
                  {topTrickCard.playerName}
                </span>
              </div>
            )}

            {/* 2. SOL KART */}
            {leftTrickCard && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center animate-pop-in z-10">
                <Card card={leftTrickCard.card} size="sm" isFourColor={isFourColor} />
                <span className="text-[9px] font-bold text-slate-300 bg-slate-950/80 px-1 rounded -mt-1 shadow">
                  {leftTrickCard.playerName}
                </span>
              </div>
            )}

            {/* 3. SAĞ KART */}
            {rightTrickCard && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center animate-pop-in z-10">
                <Card card={rightTrickCard.card} size="sm" isFourColor={isFourColor} />
                <span className="text-[9px] font-bold text-slate-300 bg-slate-950/80 px-1 rounded -mt-1 shadow">
                  {rightTrickCard.playerName}
                </span>
              </div>
            )}

            {/* 4. ALT KART */}
            {bottomTrickCard && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center animate-pop-in z-10">
                <Card card={bottomTrickCard.card} size="sm" isFourColor={isFourColor} />
                <span className="text-[9px] font-bold text-amber-300 bg-slate-950/80 px-1 rounded -mt-1 shadow">
                  {bottomTrickCard.playerName}
                </span>
              </div>
            )}

            {/* ELİ KAZANAN OYUNCU VURGUSU */}
            {status === 'trick_won' && lastTrickWinner && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 rounded-full animate-pop-in p-2 text-center border-2 border-amber-400">
                <span className="text-2xl animate-bounce">👑</span>
                <span className="text-xs font-black text-amber-300 tracking-wide">
                  Eli Aldı:
                </span>
                <span className="text-sm font-extrabold text-white truncate max-w-[120px]">
                  {lastTrickWinner.name}
                </span>
              </div>
            )}

            {/* Yerde kart yokken durum */}
            {trickCards.length === 0 && status !== 'trick_won' && (
              <div className="relative z-0 text-center px-2 pointer-events-none">
                <span className="text-lg">⚔️</span>
                <div className="text-[10px] font-black text-amber-300/80 tracking-wide">
                  {status === 'selecting_contract' ? 'KONTRAT BEKLENİYOR' : `LÖVE ${trickNumber}`}
                </div>
              </div>
            )}

          </div>

          {/* SAĞ OYUNCU (Doğu) */}
          <div className="z-10 -mr-1">
            <PlayerSeat
              player={rightPlayer}
              position="right"
              isTurn={turnSeat === rightSeatKey}
              secondsLeft={secondsLeft}
              isKaro2={gameRound === 1 && karo2Seat === rightSeatKey}
              taunt={activeTaunt && activeTaunt.senderSeat === rightSeatKey ? activeTaunt : null}
              isSelf={!isSpectator && bottomSeatKey === rightSeatKey}
              livePenalty={livePenalties[rightSeatKey]}
            />
          </div>
        </div>

        {/* ALT OYUNCU KUTUSU (KENDİMİZ) */}
        <div className="pb-0.5 z-10 flex flex-col items-center">
          <PlayerSeat
            player={bottomPlayer}
            position="bottom"
            isTurn={turnSeat === bottomSeatKey}
            secondsLeft={secondsLeft}
            isKaro2={gameRound === 1 && karo2Seat === bottomSeatKey}
            taunt={activeTaunt && activeTaunt.senderSeat === bottomSeatKey ? activeTaunt : null}
            isSelf={!isSpectator}
            livePenalty={livePenalties[bottomSeatKey]}
          />
        </div>
      </div>

      {/* 3. EN ALT KISIM: ELİMİZDEKİ KARTLAR (HAND) */}
      <div className="w-full z-20 flex-shrink-0">
        <Hand
          cards={myHand}
          isSpectator={isSpectator}
          selectedCardId={selectedCardId}
          onCardSelect={handleCardClick}
          isFourColor={isFourColor}
          onToggleFourColor={onToggleFourColor}
          playableCardIds={playableCardIds}
          isMyTurn={isMyTurn}
          onPlayCard={handleCardPlay}
        />
      </div>

      {/* 4. SAĞ ALT KÖŞE: LAF AT BUTONU */}
      <button
        onClick={() => setIsTauntOpen(true)}
        className="fixed bottom-24 right-3 z-40 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs px-3 py-2 rounded-full shadow-2xl border border-amber-300/60 active:scale-95 animate-pop-in"
      >
        <span className="text-sm">📢</span>
        <span>Laf At</span>
      </button>

      {/* 5. TÜM MODALLAR */}
      {/* A) Detaylı Yazboz Modalı */}
      <ScoreModal
        isOpen={isScoreOpen}
        onClose={() => setIsScoreOpen(false)}
        seats={seats}
        contractsRecord={contractsRecord}
        roundHistory={roundHistory}
        onOpenSwapModal={() => setIsSwapOpen(true)}
      />

      {/* B) Laf Atma Modalı */}
      <TauntModal
        isOpen={isTauntOpen}
        onClose={() => setIsTauntOpen(false)}
        onSendTaunt={onSendTaunt}
      />

      {/* C) Kontrat Seçim Modalı */}
      <ContractModal
        isOpen={isContractSelecting}
        gameRound={gameRound}
        playerState={seats[contractSelectorSeat] || {}}
        contractsRecord={contractsRecord}
        isMyTurn={isMyContractTurn}
        selectorPlayerName={selectorPlayerName}
        secondsLeft={secondsLeft}
        karo2Seat={karo2Seat}
        onSelectContract={onSelectContract}
      />

      {/* D) El Sonu Özet Modalı (Her el bittiğinde açılır) */}
      <RoundSummaryModal
        isOpen={status === 'round_finished'}
        gameRound={gameRound}
        contract={lastRoundResult?.contract || currentContract}
        roundScores={lastRoundResult?.scores || {}}
        roundDetails={lastRoundResult?.details || {}}
        seats={seats}
        nextSelectorName={nextSelectorName}
        onNextRound={onNextRound}
        earlyFinishReason={earlyFinishReason}
      />

      {/* E) 20. El Oyun Sonu Şampiyon Modalı */}
      <GameOverModal
        isOpen={status === 'game_finished'}
        seats={seats}
        onRestartGame={onFillBotsAndStart}
      />

      {/* F) Yancı ile Koltuk Değiştirme Modalı */}
      <SwapSeatModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        seats={seats}
        spectator={spectator}
        onSwapWithSpectator={onSwapWithSpectator}
      />

    </div>
  );
}
