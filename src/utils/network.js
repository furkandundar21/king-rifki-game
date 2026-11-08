import mqtt from 'mqtt';
import { dealCards, sortHand } from './cards';
import { determineTrickWinner, getNextSeat, getPlayableCards, SEAT_ORDER } from './rules';
import { chooseBotContract, chooseBotCard } from './bot';
import { calculateRoundScores, checkEarlyRoundFinish } from './scoring';

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

export function getDefaultRoomState(pin = '1923') {
  return {
    pin,
    status: 'lobby',
    gameRound: 1,
    totalRounds: 20,
    contractSelectorSeat: 'south',
    turnSeat: 'south',
    currentContract: null,
    activeContract: 'Kontrat Seçiliyor...',
    hostId: null,
    seats: {
      south: null,
      west: null,
      north: null,
      east: null,
    },
    spectator: null,
    hands: {
      south: [],
      west: [],
      north: [],
      east: [],
    },
    trickCards: [],
    trickHistory: [],
    roundHistory: [],
    lastRoundResult: null,
    earlyFinishReason: null,
    trickNumber: 1,
    isHeartBroken: false,
    isTrumpBroken: false,
    lastTrickWinner: null,
    contractsRecord: {
      elAlmaz: { total: 2, played: 0, name: 'El Almaz', pts: -50 },
      kupaAlmaz: { total: 2, played: 0, name: 'Kupa Almaz', pts: -30 },
      erkekAlmaz: { total: 2, played: 0, name: 'Erkek Almaz', pts: -60 },
      kizAlmaz: { total: 2, played: 0, name: 'Kız Almaz', pts: -100 },
      rifki: { total: 2, played: 0, name: 'Rıfkı (♥K)', pts: -320 },
      sonIki: { total: 2, played: 0, name: 'Son İki', pts: -180 },
      koz: { total: 8, played: 0, name: 'Koz', pts: 50 },
    },
    updatedAt: Date.now(),
  };
}

class CloudGameNetwork {
  constructor() {
    this.client = null;
    this.roomPin = '1923';
    this.playerId = null;
    this.playerName = '';
    this.seat = 'south';
    this.isConnected = false;
    this.roomState = getDefaultRoomState('1923');
    this.botTimer = null;
    this.trickTimer = null;
    this.processedActionIds = new Set();
    this.callbacks = {
      onStateChange: () => {},
      onTaunt: () => {},
      onConnectionChange: () => {},
      onError: () => {},
    };
  }

  init({ roomPin, playerId, playerName, seat, onStateChange, onTaunt, onConnectionChange, onError }) {
    this.roomPin = String(roomPin || '1923').trim();
    this.playerId = playerId;
    this.playerName = playerName;
    this.seat = seat;

    if (onStateChange) this.callbacks.onStateChange = onStateChange;
    if (onTaunt) this.callbacks.onTaunt = onTaunt;
    if (onConnectionChange) this.callbacks.onConnectionChange = onConnectionChange;
    if (onError) this.callbacks.onError = onError;

    this.connect();
  }

  connect(brokerIndex = 0) {
    if (brokerIndex >= BROKERS.length) {
      this.callbacks.onConnectionChange(false, 'Bulut brokerı çevrimdışı (Yerel Mod)');
      return;
    }

    const brokerUrl = BROKERS[brokerIndex];
    this.callbacks.onConnectionChange(false, 'Buluta bağlanılıyor...');

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: `king_${this.playerId}_${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 3000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.callbacks.onConnectionChange(true, 'İnternet Bağlantısı Canlı 🌐');

        const stateTopic = `king_game/${this.roomPin}/state`;
        const actionTopic = `king_game/${this.roomPin}/action`;
        const tauntTopic = `king_game/${this.roomPin}/taunt`;

        this.client.subscribe([stateTopic, actionTopic, tauntTopic], (err) => {
          if (!err) {
            this.sendAction({
              type: 'JOIN',
              playerId: this.playerId,
              playerName: this.playerName,
              seat: this.seat,
            });
          }
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          this.handleIncomingMessage(topic, payload);
        } catch (e) {
          console.error('MQTT Mesaj parse hatası:', e);
        }
      });

      this.client.on('error', () => {
        if (!this.isConnected) {
          this.client.end(true);
          this.connect(brokerIndex + 1);
        }
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        this.callbacks.onConnectionChange(false, 'Bağlantı koptu, tekrar deneniyor...');
      });

    } catch (e) {
      this.connect(brokerIndex + 1);
    }
  }

  handleIncomingMessage(topic, payload) {
    const stateTopic = `king_game/${this.roomPin}/state`;
    const actionTopic = `king_game/${this.roomPin}/action`;
    const tauntTopic = `king_game/${this.roomPin}/taunt`;

    if (topic === stateTopic) {
      if (payload && payload.updatedAt > (this.roomState.updatedAt || 0)) {
        if (this.roomState.status !== 'trick_won') {
          this.roomState = payload;
          this.callbacks.onStateChange(this.roomState);
          this.checkBotTurn();
        }
      }
    } else if (topic === actionTopic) {
      if (payload.actionId && this.processedActionIds.has(payload.actionId)) {
        return;
      }
      this.handleAction(payload);
    } else if (topic === tauntTopic) {
      this.callbacks.onTaunt(payload);
    }
  }

  handleAction(action) {
    if (action.actionId) {
      this.processedActionIds.add(action.actionId);
      if (this.processedActionIds.size > 200) {
        const first = this.processedActionIds.values().next().value;
        this.processedActionIds.delete(first);
      }
    }

    let stateModified = false;
    const current = { ...this.roomState };

    if (!current.hostId) {
      current.hostId = action.playerId || this.playerId;
    }

    if (action.type === 'JOIN') {
      const { playerId, playerName, seat } = action;

      for (const s of SEAT_ORDER) {
        if (current.seats[s] && current.seats[s].playerId === playerId) {
          current.seats[s] = null;
        }
      }
      if (current.spectator && current.spectator.playerId === playerId) {
        current.spectator = null;
      }

      if (seat === 'spectator') {
        current.spectator = { playerId, name: playerName, connected: true };
      } else if (SEAT_ORDER.includes(seat)) {
        current.seats[seat] = {
          playerId,
          name: playerName,
          penaltiesLeft: 3,
          trumpsLeft: 2,
          totalScore: 0,
          handCount: current.hands[seat]?.length || 0,
          tricksWon: 0,
          connected: true,
        };
      }

      current.updatedAt = Date.now();
      stateModified = true;

    } else if (action.type === 'START_GAME' || action.type === 'FILL_BOTS_AND_START') {
      if (action.type === 'FILL_BOTS_AND_START') {
        const botNames = {
          south: 'Ahmet',
          east: 'Ayşe (Bot) 🤖',
          north: 'Selim (Bot) 🤖',
          west: 'Mehmet (Bot) 🤖',
        };
        for (const s of SEAT_ORDER) {
          if (!current.seats[s]) {
            current.seats[s] = {
              playerId: `bot_${s}`,
              name: botNames[s],
              penaltiesLeft: 3,
              trumpsLeft: 2,
              totalScore: 0,
              handCount: 13,
              tricksWon: 0,
              connected: true,
            };
          }
        }
        if (!current.spectator) {
          current.spectator = { playerId: 'bot_spec', name: 'Murat (Yancı) ☕', connected: true };
        }
      }

      const dealtHands = dealCards();
      current.hands = dealtHands;
      current.status = 'selecting_contract';
      current.gameRound = 1;
      current.contractSelectorSeat = 'south';
      current.turnSeat = 'south';
      current.currentContract = null;
      current.activeContract = 'Kontrat Seçiliyor...';
      current.trickCards = [];
      current.trickHistory = [];
      current.roundHistory = [];
      current.lastRoundResult = null;
      current.earlyFinishReason = null;
      current.trickNumber = 1;
      current.isHeartBroken = false;
      current.isTrumpBroken = false;
      current.lastTrickWinner = null;

      for (const s of SEAT_ORDER) {
        if (current.seats[s]) {
          current.seats[s].handCount = 13;
          current.seats[s].tricksWon = 0;
          current.seats[s].totalScore = 0;
          current.seats[s].penaltiesLeft = 3;
          current.seats[s].trumpsLeft = 2;
        }
      }

      current.updatedAt = Date.now();
      stateModified = true;

    } else if (action.type === 'SELECT_CONTRACT') {
      const { contract, selectorSeat } = action;
      current.currentContract = contract;
      current.activeContract = contract.name;
      current.status = 'playing';
      current.turnSeat = selectorSeat || current.contractSelectorSeat;
      current.trickCards = [];
      current.trickHistory = [];
      current.trickNumber = 1;
      current.isHeartBroken = false;
      current.isTrumpBroken = false;
      current.lastTrickWinner = null;
      current.earlyFinishReason = null;

      const seatKey = selectorSeat || current.contractSelectorSeat;
      const selector = current.seats[seatKey];
      if (selector) {
        if (contract.type === 'penalty') {
          selector.penaltiesLeft = Math.max(0, (selector.penaltiesLeft ?? 3) - 1);
        } else if (contract.type === 'trump') {
          selector.trumpsLeft = Math.max(0, (selector.trumpsLeft ?? 2) - 1);
        }
      }

      if (contract.id && current.contractsRecord[contract.id]) {
        current.contractsRecord[contract.id].played = (current.contractsRecord[contract.id].played || 0) + 1;
      }

      current.updatedAt = Date.now();
      stateModified = true;

    } else if (action.type === 'PLAY_CARD') {
      const { card, seat, playerName } = action;

      if (current.status === 'trick_won' || current.status === 'round_finished') return;
      if (current.trickCards.some(tc => tc.seat === seat)) return;

      if (current.hands[seat]) {
        current.hands[seat] = current.hands[seat].filter(c => c.id !== card.id);
        if (current.seats[seat]) {
          current.seats[seat].handCount = current.hands[seat].length;
        }
      }

      if (current.trickCards.length > 0) {
        const leadSuit = current.trickCards[0].card.suit;
        if (leadSuit !== 'H' && card.suit === 'H') {
          current.isHeartBroken = true;
        }
        if (current.currentContract?.type === 'trump') {
          const trumpSuit = current.currentContract.trumpSuit;
          if (leadSuit !== trumpSuit && card.suit === trumpSuit) {
            current.isTrumpBroken = true;
          }
        }
      }

      current.trickCards.push({ seat, card, playerName });

      if (current.trickCards.length < 4) {
        current.turnSeat = getNextSeat(seat);
        current.updatedAt = Date.now();
        stateModified = true;
      } else {
        const winner = determineTrickWinner(current.trickCards, current.currentContract);
        const winnerSeat = winner.seat;
        const winnerName = current.seats[winnerSeat]?.name || winnerSeat;

        if (current.seats[winnerSeat]) {
          current.seats[winnerSeat].tricksWon = (current.seats[winnerSeat].tricksWon || 0) + 1;
        }

        current.trickHistory.push({
          trickNumber: current.trickNumber,
          cards: [...current.trickCards],
          winnerSeat,
          winnerName,
        });

        current.lastTrickWinner = {
          seat: winnerSeat,
          name: winnerName,
        };
        current.status = 'trick_won';
        current.updatedAt = Date.now();
        stateModified = true;

        if (this.trickTimer) clearTimeout(this.trickTimer);
        this.trickTimer = setTimeout(() => {
          this.finishTrick(winnerSeat);
        }, 1500);
      }

    } else if (action.type === 'NEXT_ROUND') {
      if (current.gameRound < 20) {
        current.gameRound++;
        current.contractSelectorSeat = getNextSeat(current.contractSelectorSeat);
        current.turnSeat = current.contractSelectorSeat;
        current.status = 'selecting_contract';
        current.currentContract = null;
        current.activeContract = 'Kontrat Seçiliyor...';
        current.trickNumber = 1;
        current.trickCards = [];
        current.trickHistory = [];
        current.isHeartBroken = false;
        current.isTrumpBroken = false;
        current.lastTrickWinner = null;
        current.earlyFinishReason = null;
        current.lastRoundResult = null;

        const newHands = dealCards();
        current.hands = newHands;
        for (const s of SEAT_ORDER) {
          if (current.seats[s]) {
            current.seats[s].handCount = 13;
            current.seats[s].tricksWon = 0;
          }
        }
      } else {
        current.status = 'game_finished';
      }

      current.updatedAt = Date.now();
      stateModified = true;

    } else if (action.type === 'SWAP_SEAT_WITH_SPECTATOR') {
      const { targetSeat } = action;
      if (current.spectator && current.seats[targetSeat]) {
        const oldPlayer = current.seats[targetSeat];
        const newPlayer = current.spectator;

        current.seats[targetSeat] = {
          playerId: newPlayer.playerId,
          name: newPlayer.name,
          penaltiesLeft: oldPlayer.penaltiesLeft,
          trumpsLeft: oldPlayer.trumpsLeft,
          totalScore: oldPlayer.totalScore,
          handCount: oldPlayer.handCount,
          tricksWon: oldPlayer.tricksWon,
          connected: true,
        };

        current.spectator = {
          playerId: oldPlayer.playerId,
          name: oldPlayer.name,
          connected: true,
        };

        current.updatedAt = Date.now();
        stateModified = true;
      }

    } else if (action.type === 'RESET_TO_LOBBY') {
      current.status = 'lobby';
      current.hands = { south: [], west: [], north: [], east: [] };
      current.trickCards = [];
      current.trickHistory = [];
      current.currentContract = null;
      current.activeContract = 'Kontrat Seçiliyor...';
      current.updatedAt = Date.now();
      stateModified = true;

    } else if (action.type === 'CLEAR_SEATS') {
      current.seats = { south: null, west: null, north: null, east: null };
      current.spectator = null;
      current.status = 'lobby';
      current.hands = { south: [], west: [], north: [], east: [] };
      current.trickCards = [];
      current.trickHistory = [];
      current.currentContract = null;
      current.updatedAt = Date.now();
      stateModified = true;
    }

    if (stateModified) {
      this.roomState = current;
      this.callbacks.onStateChange(this.roomState);

      if (this.client && this.isConnected) {
        const stateTopic = `king_game/${this.roomPin}/state`;
        this.client.publish(stateTopic, JSON.stringify(current), { retain: true, qos: 1 });
      }

      this.checkBotTurn();
    }
  }

  finishTrick(winnerSeat) {
    const current = { ...this.roomState };
    current.trickCards = [];
    current.lastTrickWinner = null;

    const earlyCheck = checkEarlyRoundFinish({
      contract: current.currentContract,
      trickHistory: current.trickHistory,
    });

    const is13TricksDone = current.trickNumber >= 13;

    if (earlyCheck || is13TricksDone) {
      current.earlyFinishReason = earlyCheck?.reason || null;

      const { scores, details } = calculateRoundScores({
        contract: current.currentContract,
        trickHistory: current.trickHistory,
        tricksWon: {
          south: current.seats.south?.tricksWon || 0,
          east:  current.seats.east?.tricksWon || 0,
          north: current.seats.north?.tricksWon || 0,
          west:  current.seats.west?.tricksWon || 0,
        },
      });

      for (const s of SEAT_ORDER) {
        if (current.seats[s]) {
          current.seats[s].totalScore = (current.seats[s].totalScore || 0) + (scores[s] || 0);
        }
      }

      current.roundHistory.push({
        roundNumber: current.gameRound,
        contractName: current.currentContract.name,
        scores,
        details,
      });

      current.lastRoundResult = {
        scores,
        details,
        contract: current.currentContract,
      };

      current.status = 'round_finished';
    } else {
      current.trickNumber++;
      current.turnSeat = winnerSeat;
      current.status = 'playing';
    }

    current.updatedAt = Date.now();
    this.roomState = current;
    this.callbacks.onStateChange(this.roomState);

    if (this.client && this.isConnected) {
      const stateTopic = `king_game/${this.roomPin}/state`;
      this.client.publish(stateTopic, JSON.stringify(current), { retain: true, qos: 1 });
    }

    this.checkBotTurn();
  }

  checkBotTurn() {
    if (this.botTimer) clearTimeout(this.botTimer);

    const { status, turnSeat, contractSelectorSeat, seats, hands, currentContract, gameRound, contractsRecord, trickCards } = this.roomState;

    if (status === 'trick_won' || status === 'round_finished' || status === 'game_finished' || status === 'lobby') {
      return;
    }

    if (status === 'selecting_contract') {
      const selector = seats[contractSelectorSeat];
      if (selector && selector.playerId?.startsWith('bot_')) {
        this.botTimer = setTimeout(() => {
          const botHand = hands[contractSelectorSeat] || [];
          const contract = chooseBotContract({
            botSeat: contractSelectorSeat,
            gameRound,
            playerState: selector,
            contractsRecord,
            botHand,
          });

          this.sendAction({
            type: 'SELECT_CONTRACT',
            contract,
            selectorSeat: contractSelectorSeat,
            playerId: selector.playerId,
          });
        }, 1000);
      }
      return;
    }

    if (status === 'playing') {
      const turnPlayer = seats[turnSeat];
      if (turnPlayer && turnPlayer.playerId?.startsWith('bot_')) {
        if (trickCards.some(tc => tc.seat === turnSeat)) return;

        this.botTimer = setTimeout(() => {
          if (this.roomState.status !== 'playing' || this.roomState.turnSeat !== turnSeat) return;

          const botHand = hands[turnSeat] || [];
          if (botHand.length === 0) return;

          const playableIds = getPlayableCards({
            hand: botHand,
            trickCards: this.roomState.trickCards,
            contract: this.roomState.currentContract,
            isHeartBroken: this.roomState.isHeartBroken,
            isTrumpBroken: this.roomState.isTrumpBroken,
          });

          const cardToPlay = chooseBotCard({
            hand: botHand,
            playableCardIds: playableIds,
            trickCards: this.roomState.trickCards,
            contract: this.roomState.currentContract,
          });

          this.sendAction({
            type: 'PLAY_CARD',
            card: cardToPlay,
            seat: turnSeat,
            playerId: turnPlayer.playerId,
            playerName: turnPlayer.name,
          });
        }, 800);
      }
    }
  }

  sendAction(action) {
    if (!action.actionId) {
      action.actionId = 'act_' + Math.random().toString(36).substring(2, 10) + Date.now();
    }
    this.handleAction(action);
    if (this.client && this.isConnected) {
      const actionTopic = `king_game/${this.roomPin}/action`;
      this.client.publish(actionTopic, JSON.stringify(action), { qos: 1 });
    }
  }

  sendTaunt(text) {
    let senderSeat = 'spectator';
    for (const s of SEAT_ORDER) {
      if (this.roomState.seats[s] && this.roomState.seats[s].playerId === this.playerId) {
        senderSeat = s;
        break;
      }
    }

    const tauntPayload = {
      id: Math.random().toString(36).substring(2, 9),
      senderSeat,
      senderName: this.playerName || 'Oyuncu',
      senderPlayerId: this.playerId,
      text: String(text).trim().slice(0, 100),
      timestamp: Date.now(),
    };

    this.callbacks.onTaunt(tauntPayload);
    if (this.client && this.isConnected) {
      const tauntTopic = `king_game/${this.roomPin}/taunt`;
      this.client.publish(tauntTopic, JSON.stringify(tauntPayload));
    }
  }

  changeRoom(newPin) {
    this.roomPin = String(newPin || '1923').trim();
    if (this.client && this.isConnected) {
      this.client.end(true, () => {
        this.connect();
      });
    }
  }
}

export const cloudNetwork = new CloudGameNetwork();
