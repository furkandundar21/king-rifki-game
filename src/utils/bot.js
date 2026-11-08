// King (Rıfkı) Akıllı Bot Karar Motoru

import { getPlayableCards } from './rules';

export function chooseBotContract({
  botSeat,
  gameRound,
  playerState,
  contractsRecord,
  botHand = [],
}) {
  const isFirstFourRounds = gameRound <= 4;
  const canChoosePenalty = (playerState?.penaltiesLeft ?? 3) > 0;
  const canChooseTrump = !isFirstFourRounds && (playerState?.trumpsLeft ?? 2) > 0;

  const availablePenalties = [];
  const penaltyKeys = ['elAlmaz', 'kupaAlmaz', 'erkekAlmaz', 'kizAlmaz', 'rifki', 'sonIki'];

  for (const key of penaltyKeys) {
    const rec = contractsRecord?.[key];
    const played = rec?.played || 0;
    const total = rec?.total || 2;
    if (played < total) {
      availablePenalties.push(key);
    }
  }

  if (isFirstFourRounds || !canChooseTrump || (canChoosePenalty && Math.random() > 0.4)) {
    if (availablePenalties.length > 0 && canChoosePenalty) {
      const chosenKey = availablePenalties[Math.floor(Math.random() * availablePenalties.length)];
      const names = {
        elAlmaz: 'El Almaz',
        kupaAlmaz: 'Kupa Almaz',
        erkekAlmaz: 'Erkek Almaz',
        kizAlmaz: 'Kız Almaz',
        rifki: 'Rıfkı (♥K)',
        sonIki: 'Son İki',
      };
      return {
        type: 'penalty',
        id: chosenKey,
        name: names[chosenKey],
        trumpSuit: null,
      };
    }
  }

  if (canChooseTrump) {
    const suitCounts = { H: 0, S: 0, D: 0, C: 0 };
    botHand.forEach(c => {
      if (suitCounts[c.suit] !== undefined) suitCounts[c.suit]++;
    });

    let bestSuit = 'S';
    let maxCount = -1;
    for (const [suit, count] of Object.entries(suitCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestSuit = suit;
      }
    }

    const suitNames = { H: '♥ Kupa', S: '♠ Maça', D: '♦ Karo', C: '♣ Sinek' };
    return {
      type: 'trump',
      id: 'koz',
      name: `Koz: ${suitNames[bestSuit]}`,
      trumpSuit: bestSuit,
    };
  }

  return {
    type: 'penalty',
    id: availablePenalties[0] || 'elAlmaz',
    name: 'El Almaz',
    trumpSuit: null,
  };
}

export function chooseBotCard({
  hand = [],
  playableCardIds = [],
  trickCards = [],
  contract = null,
}) {
  const validCards = hand.filter(c => playableCardIds.includes(c.id));
  if (validCards.length === 0) return hand[0];
  if (validCards.length === 1) return validCards[0];

  const isPenalty = contract?.type === 'penalty';
  const isFirstCard = trickCards.length === 0;

  if (isPenalty) {
    if (isFirstCard) {
      validCards.sort((a, b) => a.value - b.value);
      return validCards[0];
    } else {
      const leadSuit = trickCards[0].card.suit;
      const matching = validCards.filter(c => c.suit === leadSuit);

      if (matching.length > 0) {
        const highestLead = Math.max(...trickCards.filter(tc => tc.card.suit === leadSuit).map(tc => tc.card.value));
        const belowHighest = matching.filter(c => c.value < highestLead);
        if (belowHighest.length > 0) {
          belowHighest.sort((a, b) => b.value - a.value);
          return belowHighest[0];
        }
        matching.sort((a, b) => a.value - b.value);
        return matching[0];
      } else {
        if (contract?.id === 'rifki') {
          const rifki = validCards.find(c => c.isRifki);
          if (rifki) return rifki;
        }
        if (contract?.id === 'kizAlmaz') {
          const queen = validCards.find(c => c.value === 12);
          if (queen) return queen;
        }
        if (contract?.id === 'erkekAlmaz') {
          const male = validCards.find(c => c.value === 11 || c.value === 13);
          if (male) return male;
        }
        if (contract?.id === 'kupaAlmaz') {
          const heart = validCards.find(c => c.suit === 'H');
          if (heart) return heart;
        }

        validCards.sort((a, b) => b.value - a.value);
        return validCards[0];
      }
    }
  }

  validCards.sort((a, b) => a.value - b.value);
  return validCards[0];
}
