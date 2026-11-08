// 52'lik Standart İskambil Destesi ve Dağıtım Motoru

export const SUITS = [
  { id: 'H', name: 'Kupa', symbol: '♥', color: 'red', order: 0 },
  { id: 'S', name: 'Maça', symbol: '♠', color: 'black', order: 1 },
  { id: 'D', name: 'Karo', symbol: '♦', color: 'red', order: 2 },
  { id: 'C', name: 'Sinek', symbol: '♣', color: 'black', order: 3 },
];

export const VALUES = [
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
  { value: 13, label: 'K' }, // Kupa K = RIFKI
  { value: 14, label: 'A' },
];

// 52 Kartı Oluştur
export function createDeck() {
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
        isRifki: suit.id === 'H' && val.value === 13, // Kupa Papazı
      });
    }
  }
  return deck;
}

// Fisher-Yates Karıştırma Algoritması
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 4 Oyuncuya 13'er Kart Dağıt
export function dealCards() {
  const shuffled = shuffleDeck(createDeck());
  const seatKeys = ['south', 'east', 'north', 'west'];
  const hands = {
    south: [],
    east: [],
    north: [],
    west: [],
  };

  seatKeys.forEach((seat, idx) => {
    const hand = shuffled.slice(idx * 13, (idx + 1) * 13);
    hands[seat] = sortHand(hand);
  });

  return hands;
}

// Karo 2 (♦2) hangi koltuktaysa o koltuğu bulur (King kuralı: 1. oyunu Karo 2 kimdeyse o seçer)
export function findKaro2Seat(hands) {
  if (!hands) return 'south';
  const seatKeys = ['south', 'east', 'north', 'west'];
  for (const s of seatKeys) {
    if (hands[s] && hands[s].some(c => c.suit === 'D' && c.value === 2)) {
      return s;
    }
  }
  return 'south';
}

// Eli Renk ve Sayıya Göre Sırala (Kupa -> Maça -> Karo -> Sinek, 2'den As'a)
export function sortHand(cards) {
  if (!cards || !Array.isArray(cards)) return [];
  return [...cards].sort((a, b) => {
    if (a.suitOrder !== b.suitOrder) {
      return a.suitOrder - b.suitOrder;
    }
    return a.value - b.value;
  });
}
