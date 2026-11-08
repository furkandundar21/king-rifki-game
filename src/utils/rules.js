// King (Rıfkı) Oyun Kuralları ve Doğrulama Motoru

export const CONTRACT_DEFINITIONS = [
  { id: 'elAlmaz', name: 'El Almaz', type: 'penalty', total: 2, icon: '✋', pts: '-50 / el' },
  { id: 'kupaAlmaz', name: 'Kupa Almaz', type: 'penalty', total: 2, icon: '♥', pts: '-30 / kupa' },
  { id: 'erkekAlmaz', name: 'Erkek Almaz (J, K)', type: 'penalty', total: 2, icon: '🤴', pts: '-60 / erkek' },
  { id: 'kizAlmaz', name: 'Kız Almaz (Q)', type: 'penalty', total: 2, icon: '👸', pts: '-100 / kız' },
  { id: 'rifki', name: 'Rıfkı (♥ Papazı)', type: 'penalty', total: 2, icon: '👑', pts: '-320' },
  { id: 'sonIki', name: 'Son İki', type: 'penalty', total: 2, icon: '⌛', pts: '-180 / el' },
  { id: 'koz', name: 'Koz', type: 'trump', total: 8, icon: '⚔️', pts: '+50 / el' },
];

export const SEAT_ORDER = ['south', 'east', 'north', 'west'];

export function getNextSeat(currentSeat) {
  const idx = SEAT_ORDER.indexOf(currentSeat);
  if (idx === -1) return 'south';
  return SEAT_ORDER[(idx + 1) % 4];
}

export function getPlayableCards({
  hand = [],
  trickCards = [],
  contract = null,
  isHeartBroken = false,
  isTrumpBroken = false,
}) {
  if (!hand || hand.length === 0) return [];
  if (!contract) return hand.map(c => c.id);

  const isFirstCardOfTrick = trickCards.length === 0;

  if (isFirstCardOfTrick) {
    const contractId = contract.id;
    const isTrump = contract.type === 'trump';
    const trumpSuit = contract.trumpSuit;

    const freeLeadContracts = ['elAlmaz', 'kizAlmaz', 'erkekAlmaz', 'sonIki'];
    if (freeLeadContracts.includes(contractId)) {
      return hand.map(c => c.id);
    }

    if ((contractId === 'kupaAlmaz' || contractId === 'rifki') && !isHeartBroken) {
      const nonHearts = hand.filter(c => c.suit !== 'H');
      if (nonHearts.length > 0) {
        return nonHearts.map(c => c.id);
      }
      return hand.map(c => c.id);
    }

    if (isTrump && !isTrumpBroken) {
      const nonTrumps = hand.filter(c => c.suit !== trumpSuit);
      if (nonTrumps.length > 0) {
        return nonTrumps.map(c => c.id);
      }
      return hand.map(c => c.id);
    }

    return hand.map(c => c.id);
  }

  const leadCard = trickCards[0].card;
  const leadSuit = leadCard.suit;
  const matchingSuitCards = hand.filter(c => c.suit === leadSuit);

  if (matchingSuitCards.length > 0) {
    if (contract.type === 'trump') {
      const highestLeadOnTable = Math.max(
        ...trickCards.filter(tc => tc.card.suit === leadSuit).map(tc => tc.card.value)
      );
      const higherCards = matchingSuitCards.filter(c => c.value > highestLeadOnTable);
      if (higherCards.length > 0) {
        return higherCards.map(c => c.id);
      }
    }
    return matchingSuitCards.map(c => c.id);
  }

  if (contract.type === 'trump') {
    const trumpSuit = contract.trumpSuit;
    const trumpCards = hand.filter(c => c.suit === trumpSuit);

    if (trumpCards.length > 0) {
      const trumpsOnTable = trickCards.filter(tc => tc.card.suit === trumpSuit);
      if (trumpsOnTable.length > 0) {
        const highestTrumpOnTable = Math.max(...trumpsOnTable.map(tc => tc.card.value));
        const higherTrumps = trumpCards.filter(c => c.value > highestTrumpOnTable);
        if (higherTrumps.length > 0) {
          return higherTrumps.map(c => c.id);
        }
        return trumpCards.map(c => c.id);
      }
      return trumpCards.map(c => c.id);
    }
    return hand.map(c => c.id);
  }

  return hand.map(c => c.id);
}

export function determineTrickWinner(trickCards = [], contract = null) {
  if (!trickCards || trickCards.length === 0) return null;

  const leadSuit = trickCards[0].card.suit;
  const isTrump = contract?.type === 'trump';
  const trumpSuit = contract?.trumpSuit;

  if (isTrump) {
    const trumpPlayed = trickCards.filter(tc => tc.card.suit === trumpSuit);
    if (trumpPlayed.length > 0) {
      trumpPlayed.sort((a, b) => b.card.value - a.card.value);
      return trumpPlayed[0];
    }
  }

  const leadCardsPlayed = trickCards.filter(tc => tc.card.suit === leadSuit);
  leadCardsPlayed.sort((a, b) => b.card.value - a.card.value);
  return leadCardsPlayed[0];
}
