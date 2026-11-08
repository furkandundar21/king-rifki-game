import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../dist')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();
const PORT = process.env.PORT || 3001;

const SUITS = [
  { id: 'H', name: 'Kupa', symbol: '♥', color: 'red', order: 0 },
  { id: 'S', name: 'Maça', symbol: '♠', color: 'black', order: 1 },
  { id: 'D', name: 'Karo', symbol: '♦', color: 'red', order: 2 },
  { id: 'C', name: 'Sinek', symbol: '♣', color: 'black', order: 3 },
];

const VALUES = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
  { value: 11, label: 'J' },
  { value: 12, label: 'Q' },
  { value: 13, label: 'K' },
  { value: 14, label: 'A' },
];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const val of VALUES) {
      deck.push({
        id: `${suit.id}_${val.value}`,
        suit: suit.id,
        suitName: suit.name,
        suitSymbol: suit.symbol,
        suitColor: suit.color,
        suitOrder: suit.order,
        value: val.value,
        label: val.label,
        isRifki: suit.id === 'H' && val.value === 13,
      });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sortHand(cards) {
  return [...cards].sort((a, b) => {
    if (a.suitOrder !== b.suitOrder) {
      return a.suitOrder - b.suitOrder;
    }
    return a.value - b.value;
  });
}

const rooms = {};

function getDefaultRoom(pin) {
  return {
    pin,
    status: 'lobby',
    gameRound: 1,
    totalRounds: 20,
    turnSeat: 'south',
    activeContract: 'Seçiliyor...',
    contractType: null,
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
    tableCards: [],
    contractsRecord: {
      elAlmaz: { total: 2, played: 0, name: 'El Almaz', points: -50 },
      kupaAlmaz: { total: 2, played: 0, name: 'Kupa Almaz', points: -30 },
      erkekAlmaz: { total: 2, played: 0, name: 'Erkek Almaz', points: -60 },
      kizAlmaz: { total: 2, played: 0, name: 'Kız Almaz', points: -100 },
      rifki: { total: 2, played: 0, name: 'Rıfkı (♥K)', points: -320 },
      sonIki: { total: 2, played: 0, name: 'Son İki', points: -180 },
      koz: { total: 8, played: 0, name: 'Koz', points: 50 },
    },
    createdAt: Date.now(),
  };
}

function getPublicRoomState(room, forPlayerId) {
  const publicSeats = {};
  for (const seatKey of ['south', 'west', 'north', 'east']) {
    const occupant = room.seats[seatKey];
    if (occupant) {
      publicSeats[seatKey] = {
        name: occupant.name,
        playerId: occupant.playerId,
        connected: occupant.connected,
        handCount: room.hands[seatKey] ? room.hands[seatKey].length : 0,
        penaltiesLeft: occupant.penaltiesLeft,
        trumpsLeft: occupant.trumpsLeft,
        totalScore: occupant.totalScore,
      };
    } else {
      publicSeats[seatKey] = null;
    }
  }

  return {
    pin: room.pin,
    status: room.status,
    gameRound: room.gameRound,
    totalRounds: room.totalRounds,
    turnSeat: room.turnSeat,
    activeContract: room.activeContract,
    seats: publicSeats,
    spectator: room.spectator ? {
      name: room.spectator.name,
      playerId: room.spectator.playerId,
      connected: room.spectator.connected,
    } : null,
    tableCards: room.tableCards,
    contractsRecord: room.contractsRecord,
  };
}

function getPlayerHand(room, playerId) {
  for (const seatKey of ['south', 'west', 'north', 'east']) {
    if (room.seats[seatKey] && room.seats[seatKey].playerId === playerId) {
      return room.hands[seatKey] || [];
    }
  }
  return [];
}

app.get('/api/info', (req, res) => {
  res.json({
    status: 'ok',
    localIp,
    port: PORT,
    accessUrl: `http://${localIp}:${PORT}`,
  });
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/socket.io') && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`[Socket] Bağlantı sağlandı: ${socket.id}`);

  socket.on('join_room', ({ pin = '1923', playerName, seat, playerId }) => {
    if (!playerName || !playerId) {
      socket.emit('error_message', 'Oyuncu adı ve kimliği gereklidir.');
      return;
    }

    const roomPin = String(pin).trim() || '1923';
    if (!rooms[roomPin]) {
      rooms[roomPin] = getDefaultRoom(roomPin);
    }
    const room = rooms[roomPin];

    socket.join(roomPin);
    socket.data = { roomPin, playerId, playerName, seat };

    let previousSeat = null;
    for (const s of ['south', 'west', 'north', 'east']) {
      if (room.seats[s] && room.seats[s].playerId === playerId) {
        previousSeat = s;
        break;
      }
    }
    if (room.spectator && room.spectator.playerId === playerId) {
      previousSeat = 'spectator';
    }

    const targetSeat = seat || previousSeat || 'spectator';

    if (targetSeat === 'spectator') {
      if (previousSeat && previousSeat !== 'spectator') {
        room.seats[previousSeat] = null;
      }
      room.spectator = {
        playerId,
        name: playerName,
        socketId: socket.id,
        connected: true,
      };
    } else if (['south', 'west', 'north', 'east'].includes(targetSeat)) {
      const currentOccupant = room.seats[targetSeat];
      if (currentOccupant && currentOccupant.playerId !== playerId) {
        socket.emit('error_message', `Bu koltuk (${targetSeat}) şu an ${currentOccupant.name} tarafından tutulmuş.`);
        return;
      }

      if (previousSeat && previousSeat !== targetSeat) {
        if (previousSeat === 'spectator') {
          room.spectator = null;
        } else {
          room.seats[previousSeat] = null;
        }
      }

      const penaltiesLeft = currentOccupant ? currentOccupant.penaltiesLeft : 3;
      const trumpsLeft = currentOccupant ? currentOccupant.trumpsLeft : 2;
      const totalScore = currentOccupant ? currentOccupant.totalScore : 0;

      room.seats[targetSeat] = {
        playerId,
        name: playerName,
        socketId: socket.id,
        penaltiesLeft,
        trumpsLeft,
        totalScore,
        connected: true,
      };
    }

    socket.emit('joined_success', {
      roomPin,
      seat: targetSeat,
      playerId,
      playerName,
    });

    const hand = getPlayerHand(room, playerId);
    socket.emit('your_hand', hand);

    io.to(roomPin).emit('room_state', getPublicRoomState(room, null));
  });

  socket.on('change_seat', ({ targetSeat }) => {
    const { roomPin, playerId, playerName } = socket.data || {};
    if (!roomPin || !rooms[roomPin]) return;
    const room = rooms[roomPin];

    let currentSeat = null;
    for (const s of ['south', 'west', 'north', 'east']) {
      if (room.seats[s] && room.seats[s].playerId === playerId) {
        currentSeat = s;
        break;
      }
    }
    if (room.spectator && room.spectator.playerId === playerId) {
      currentSeat = 'spectator';
    }

    if (!targetSeat || currentSeat === targetSeat) return;

    if (targetSeat === 'spectator') {
      if (currentSeat && currentSeat !== 'spectator') {
        room.seats[currentSeat] = null;
      }
      room.spectator = {
        playerId,
        name: playerName,
        socketId: socket.id,
        connected: true,
      };
    } else if (['south', 'west', 'north', 'east'].includes(targetSeat)) {
      if (room.seats[targetSeat] && room.seats[targetSeat].playerId !== playerId) {
        socket.emit('error_message', 'Bu koltuk dolu.');
        return;
      }
      if (currentSeat === 'spectator') {
        room.spectator = null;
      } else if (currentSeat) {
        room.seats[currentSeat] = null;
      }
      room.seats[targetSeat] = {
        playerId,
        name: playerName,
        socketId: socket.id,
        penaltiesLeft: 3,
        trumpsLeft: 2,
        totalScore: 0,
        connected: true,
      };
    }

    socket.data.seat = targetSeat;
    socket.emit('joined_success', { roomPin, seat: targetSeat, playerId, playerName });
    socket.emit('your_hand', getPlayerHand(room, playerId));
    io.to(roomPin).emit('room_state', getPublicRoomState(room, null));
  });

  socket.on('fill_test_bots', () => {
    const { roomPin } = socket.data || {};
    if (!roomPin || !rooms[roomPin]) return;
    const room = rooms[roomPin];

    const botNames = {
      south: 'Ahmet',
      west: 'Mehmet',
      north: 'Selim',
      east: 'Ayşe',
    };

    for (const seatKey of ['south', 'west', 'north', 'east']) {
      if (!room.seats[seatKey]) {
        const botId = `bot_${seatKey}_${Date.now()}`;
        room.seats[seatKey] = {
          playerId: botId,
          name: botNames[seatKey] + ' 🤖',
          socketId: null,
          penaltiesLeft: 3,
          trumpsLeft: 2,
          totalScore: 0,
          connected: true,
        };
      }
    }

    if (!room.spectator) {
      room.spectator = {
        playerId: `bot_spec_${Date.now()}`,
        name: 'Murat (Yancı) ☕',
        socketId: null,
        connected: true,
      };
    }

    io.to(roomPin).emit('room_state', getPublicRoomState(room, null));
  });

  socket.on('clear_seats', () => {
    const { roomPin } = socket.data || {};
    if (!roomPin || !rooms[roomPin]) return;
    const room = rooms[roomPin];

    room.seats = { south: null, west: null, north: null, east: null };
    room.spectator = null;
    room.status = 'lobby';
    room.hands = { south: [], west: [], north: [], east: [] };
    room.tableCards = [];

    io.to(roomPin).emit('your_hand', []);
    io.to(roomPin).emit('room_state', getPublicRoomState(room, null));
  });

  socket.on('start_game', () => {
    const { roomPin } = socket.data || {};
    if (!roomPin || !rooms[roomPin]) return;
    const room = rooms[roomPin];

    const seatedCount = ['south', 'west', 'north', 'east'].filter(s => room.seats[s] !== null).length;
    if (seatedCount < 4) {
      socket.emit('error_message', `Oyunun başlaması için 4 oyuncu gereklidir (Şu an: ${seatedCount}/4).`);
      return;
    }

    const deck = shuffleDeck(createDeck());
    const seatKeys = ['south', 'west', 'north', 'east'];
    seatKeys.forEach((seat, idx) => {
      const hand = deck.slice(idx * 13, (idx + 1) * 13);
      room.hands[seat] = sortHand(hand);
    });

    room.status = 'playing';
    room.gameRound = 1;
    room.turnSeat = 'south';
    room.activeContract = 'Kontrat Seçiliyor...';
    room.tableCards = [];

    seatKeys.forEach((seat) => {
      const occupant = room.seats[seat];
      if (occupant && occupant.socketId) {
        io.to(occupant.socketId).emit('your_hand', room.hands[seat]);
      }
    });

    if (room.spectator && room.spectator.socketId) {
      io.to(room.spectator.socketId).emit('your_hand', []);
    }

    io.to(roomPin).emit('game_started');
    io.to(roomPin).emit('room_state', getPublicRoomState(room, null));
  });

  socket.on('send_taunt', ({ text }) => {
    const { roomPin, playerId, playerName } = socket.data || {};
    if (!roomPin || !rooms[roomPin] || !text) return;
    const room = rooms[roomPin];

    let senderSeat = null;
    for (const s of ['south', 'west', 'north', 'east']) {
      if (room.seats[s] && room.seats[s].playerId === playerId) {
        senderSeat = s;
        break;
      }
    }
    if (room.spectator && room.spectator.playerId === playerId) {
      senderSeat = 'spectator';
    }

    const tauntPayload = {
      id: Math.random().toString(36).substring(2, 9),
      senderSeat: senderSeat || 'spectator',
      senderName: playerName || 'Bilinmeyen',
      senderPlayerId: playerId,
      text: String(text).trim().slice(0, 100),
      timestamp: Date.now(),
    };

    io.to(roomPin).emit('taunt_received', tauntPayload);
  });

  socket.on('reset_to_lobby', () => {
    const { roomPin } = socket.data || {};
    if (!roomPin || !rooms[roomPin]) return;
    const room = rooms[roomPin];

    room.status = 'lobby';
    room.hands = { south: [], west: [], north: [], east: [] };
    room.tableCards = [];

    io.to(roomPin).emit('your_hand', []);
    io.to(roomPin).emit('room_state', getPublicRoomState(room, null));
  });

  socket.on('disconnect', () => {
    const { roomPin, playerId, playerName } = socket.data || {};

    if (roomPin && rooms[roomPin]) {
      const room = rooms[roomPin];
      for (const s of ['south', 'west', 'north', 'east']) {
        if (room.seats[s] && room.seats[s].playerId === playerId) {
          room.seats[s].connected = false;
          break;
        }
      }
      if (room.spectator && room.spectator.playerId === playerId) {
        room.spectator.connected = false;
      }

      io.to(roomPin).emit('room_state', getPublicRoomState(room, null));
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`King server running on port ${PORT}`);
});
