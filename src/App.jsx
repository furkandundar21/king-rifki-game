import React, { useState, useEffect, useRef } from 'react';
import Lobby from './components/Lobby';
import Table from './components/Table';
import { cloudNetwork, getDefaultRoomState } from './utils/network';
import { getStoredSession, saveSession, generatePlayerId } from './utils/storage';
import { playDealSound, playTauntSound } from './utils/audio';
import { AlertCircle, Globe, Wifi, WifiOff, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // Yerel oturum durumu (localStorage)
  const session = getStoredSession() || {};
  const [playerId] = useState(() => session.playerId || generatePlayerId());
  const [playerName, setPlayerName] = useState(() => session.playerName || 'Oyuncu ' + Math.floor(100 + Math.random() * 900));
  const [roomPin, setRoomPin] = useState(() => session.roomPin || '1923');
  const [currentSeat, setCurrentSeat] = useState(() => session.seat || 'south');

  // Gerçek zamanlı oda ve el durumu
  const [roomState, setRoomState] = useState(() => getDefaultRoomState('1923'));
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatusText, setConnectionStatusText] = useState('İnternet bağlantısı başlatılıyor...');
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTaunt, setActiveTaunt] = useState(null);
  const tauntTimeoutRef = useRef(null);

  // 4 Renk Deste Modu (Kupa: Kırmızı, Maça: Siyah, Karo: Mavi, Sinek: Yeşil)
  const [isFourColor, setIsFourColor] = useState(() => {
    try {
      return localStorage.getItem('king_four_color') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleFourColor = () => {
    setIsFourColor(prev => {
      const next = !prev;
      try {
        localStorage.setItem('king_four_color', String(next));
      } catch {}
      return next;
    });
  };

  // Bulut Ağı Başlatma (Farklı internetlerden uzaktan bağlantı)
  useEffect(() => {
    cloudNetwork.init({
      roomPin,
      playerId,
      playerName,
      seat: currentSeat,
      onStateChange: (newState) => {
        setRoomState({ ...newState });

        // Kartlar yeni dağıtıldıysa ses çal
        if (newState.status === 'playing' && newState.hands && newState.hands[currentSeat]?.length > 0) {
          playDealSound();
        }
      },
      onTaunt: (taunt) => {
        playTauntSound();
        setActiveTaunt(taunt);

        if (tauntTimeoutRef.current) {
          clearTimeout(tauntTimeoutRef.current);
        }
        tauntTimeoutRef.current = setTimeout(() => {
          setActiveTaunt(null);
        }, 3500);
      },
      onConnectionChange: (connected, statusText) => {
        setIsConnected(connected);
        setConnectionStatusText(statusText);
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 4000);
      },
    });
  }, []);

  // PIN kodu değiştiğinde odayı güncelle
  const handleRoomPinChange = (newPin) => {
    setRoomPin(newPin);
    saveSession({ playerId, playerName, roomPin: newPin, seat: currentSeat });
    cloudNetwork.changeRoom(newPin);
  };

  // Koltuk Seçimi
  const handleSelectSeat = (seatKey) => {
    if (!playerName.trim()) {
      setErrorMessage('Lütfen önce bir oyuncu adı giriniz.');
      return;
    }

    setCurrentSeat(seatKey);
    saveSession({ playerId, playerName, roomPin, seat: seatKey });

    cloudNetwork.playerName = playerName;
    cloudNetwork.seat = seatKey;
    cloudNetwork.sendAction({
      type: 'JOIN',
      playerId,
      playerName,
      seat: seatKey,
    });
  };

  // 4 Gerçek Oyuncu ile Oyunu Başlat
  const handleStartGame = () => {
    cloudNetwork.sendAction({
      type: 'START_GAME',
      playerId,
    });
  };

  // 🤖 TEST MODU: Boş Koltukları Botla Doldur ve HEMEN Başlat!
  const handleFillBotsAndStart = () => {
    // Önce kendimizi geçerli bir koltuğa oturtalım (eğer koltuk yoksa 'south' yap)
    const validSeat = currentSeat && currentSeat !== 'spectator' ? currentSeat : 'south';
    setCurrentSeat(validSeat);
    saveSession({ playerId, playerName, roomPin, seat: validSeat });

    cloudNetwork.playerName = playerName;
    cloudNetwork.seat = validSeat;

    // Kendimizi ekle ve botları doldurup HEMEN oyunu başlat
    cloudNetwork.sendAction({
      type: 'JOIN',
      playerId,
      playerName,
      seat: validSeat,
    });

    cloudNetwork.sendAction({
      type: 'FILL_BOTS_AND_START',
      playerId,
    });

    playDealSound();
  };

  // Masayı Temizle
  const handleClearSeats = () => {
    cloudNetwork.sendAction({
      type: 'CLEAR_SEATS',
      playerId,
    });
  };

  // Sataşma / Laf At Gönder
  const handleSendTaunt = (text) => {
    if (text) {
      cloudNetwork.sendTaunt(text);
    }
  };

  // Lobiye Dön / Koltuk Değiştir
  const handleResetToLobby = () => {
    cloudNetwork.sendAction({
      type: 'RESET_TO_LOBBY',
      playerId,
    });
  };

  // Kontrat Seçimi (Çift tıklama ve sıra korumalı)
  const handleSelectContract = (contract) => {
    if (roomState?.status !== 'selecting_contract') return;
    if (roomState?.contractSelectorSeat !== currentSeat) return;
    cloudNetwork.sendAction({
      type: 'SELECT_CONTRACT',
      contract,
      selectorSeat: currentSeat,
      playerId,
    });
  };

  // Kart Oynama (Masaya Atma - Sıra korumalı)
  const handlePlayCard = (card) => {
    if (roomState?.status !== 'playing') return;
    if (roomState?.turnSeat !== currentSeat) return;
    cloudNetwork.sendAction({
      type: 'PLAY_CARD',
      card,
      seat: currentSeat,
      playerId,
      playerName,
    });
  };

  // El Sonu: Sonraki Ele Geç
  const handleNextRound = () => {
    cloudNetwork.sendAction({
      type: 'NEXT_ROUND',
      playerId,
    });
  };

  // Yancı (İzleyici) ile Koltuk Takası
  const handleSwapWithSpectator = (targetSeat) => {
    cloudNetwork.sendAction({
      type: 'SWAP_SEAT_WITH_SPECTATOR',
      targetSeat,
      playerId,
    });
  };

  // Oyuncunun Kendi Elindeki Kartlar (13 Kart)
  const isSpectator = currentSeat === 'spectator';
  const myHand = (!isSpectator && roomState?.hands && roomState.hands[currentSeat])
    ? roomState.hands[currentSeat]
    : [];

  const isPlaying = roomState?.status && roomState.status !== 'lobby';

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 font-['Outfit',sans-serif]">
      
      {/* Üst Bağlantı Bilgi Şeridi (İnternet Durumu - Farklı Şehirler / Mobil Veri) */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-3 py-1 text-[10px] flex items-center justify-between text-slate-400 z-40">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-sky-400" />
          <span>Uzaktan Oyun: <strong>Oda {roomPin}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[9px] text-slate-300 font-medium">{connectionStatusText}</span>
        </div>
      </div>

      {/* Hata Bildirimi (Toast) */}
      {errorMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-pop-in bg-rose-600/95 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Ana Ekran: Lobi veya Masa */}
      <div className="w-full h-[calc(100%-25px)]">
        {isPlaying ? (
          <Table
            roomState={roomState}
            mySeat={currentSeat}
            myHand={myHand}
            myPlayerId={playerId}
            onSendTaunt={handleSendTaunt}
            onResetToLobby={handleResetToLobby}
            activeTaunt={activeTaunt}
            onFillBotsAndStart={handleFillBotsAndStart}
            isFourColor={isFourColor}
            onToggleFourColor={handleToggleFourColor}
            onSelectContract={handleSelectContract}
            onPlayCard={handlePlayCard}
            onNextRound={handleNextRound}
            onSwapWithSpectator={handleSwapWithSpectator}
          />
        ) : (
          <Lobby
            roomPin={roomPin}
            setRoomPin={handleRoomPinChange}
            playerName={playerName}
            setPlayerName={(name) => {
              setPlayerName(name);
              saveSession({ playerId, playerName: name, roomPin, seat: currentSeat });
            }}
            currentSeat={currentSeat}
            seats={roomState?.seats || {}}
            spectator={roomState?.spectator || null}
            playerId={playerId}
            onSelectSeat={handleSelectSeat}
            onStartGame={handleStartGame}
            onFillBotsAndStart={handleFillBotsAndStart}
            onClearSeats={handleClearSeats}
            isConnected={isConnected}
          />
        )}
      </div>

    </div>
  );
}
