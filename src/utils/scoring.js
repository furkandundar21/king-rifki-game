// King (Rıfkı) Puan Hesaplama ve Erken Bitirme Motoru

export function calculateRoundScores({ contract, trickHistory = [], tricksWon = {} }) {
  const scores = { south: 0, east: 0, north: 0, west: 0 };
  const details = { south: '', east: '', north: '', west: '' };

  if (!contract) return { scores, details };

  const cId = contract.id;
  const isTrump = contract.type === 'trump';

  if (cId === 'elAlmaz') {
    for (const seat of ['south', 'east', 'north', 'west']) {
      const count = tricksWon[seat] || 0;
      scores[seat] = count * -50;
      details[seat] = `${count} el (${scores[seat]} P)`;
    }
    return { scores, details };
  }

  if (isTrump) {
    for (const seat of ['south', 'east', 'north', 'west']) {
      const count = tricksWon[seat] || 0;
      scores[seat] = count * 50;
      details[seat] = `${count} el (+${scores[seat]} P)`;
    }
    return { scores, details };
  }

  if (cId === 'sonIki') {
    trickHistory.forEach((trick) => {
      if (trick.trickNumber === 12 || trick.trickNumber === 13) {
        if (trick.winnerSeat) {
          scores[trick.winnerSeat] -= 180;
        }
      }
    });
    for (const seat of ['south', 'east', 'north', 'west']) {
      details[seat] = scores[seat] < 0 ? `${scores[seat]} P` : '0 P (Temiz)';
    }
    return { scores, details };
  }

  const penaltiesEaten = {
    south: { hearts: 0, queens: 0, males: 0, rifki: false },
    east:  { hearts: 0, queens: 0, males: 0, rifki: false },
    north: { hearts: 0, queens: 0, males: 0, rifki: false },
    west:  { hearts: 0, queens: 0, males: 0, rifki: false },
  };

  trickHistory.forEach((trick) => {
    const winnerSeat = trick.winnerSeat;
    if (!winnerSeat || !penaltiesEaten[winnerSeat]) return;

    trick.cards.forEach((tc) => {
      const card = tc.card;
      if (card.suit === 'H') {
        penaltiesEaten[winnerSeat].hearts++;
      }
      if (card.value === 12) {
        penaltiesEaten[winnerSeat].queens++;
      }
      if (card.value === 11 || card.value === 13) {
        penaltiesEaten[winnerSeat].males++;
      }
      if (card.isRifki || (card.suit === 'H' && card.value === 13)) {
        penaltiesEaten[winnerSeat].rifki = true;
      }
    });
  });

  for (const seat of ['south', 'east', 'north', 'west']) {
    const p = penaltiesEaten[seat];

    if (cId === 'kupaAlmaz') {
      scores[seat] = p.hearts * -30;
      details[seat] = p.hearts > 0 ? `${p.hearts} Kupa (${scores[seat]} P)` : '0 Kupa (Temiz)';
    } else if (cId === 'kizAlmaz') {
      scores[seat] = p.queens * -100;
      details[seat] = p.queens > 0 ? `${p.queens} Kız (${scores[seat]} P)` : '0 Kız (Temiz)';
    } else if (cId === 'erkekAlmaz') {
      scores[seat] = p.males * -60;
      details[seat] = p.males > 0 ? `${p.males} Erkek (${scores[seat]} P)` : '0 Erkek (Temiz)';
    } else if (cId === 'rifki') {
      scores[seat] = p.rifki ? -320 : 0;
      details[seat] = p.rifki ? 'Rıfkı (-320 P)' : 'Kurtuldu (0 P)';
    }
  }

  return { scores, details };
}

export function getLivePenaltyDisplay({ contract, trickHistory = [] }) {
  const display = { south: null, east: null, north: null, west: null };
  if (!contract) return display;

  const cId = contract.id;
  const isTrump = contract.type === 'trump';

  if (isTrump || cId === 'elAlmaz') {
    return display;
  }

  const counts = {
    south: { hearts: 0, queens: 0, males: 0, rifki: false, lastTwo: 0 },
    east:  { hearts: 0, queens: 0, males: 0, rifki: false, lastTwo: 0 },
    north: { hearts: 0, queens: 0, males: 0, rifki: false, lastTwo: 0 },
    west:  { hearts: 0, queens: 0, males: 0, rifki: false, lastTwo: 0 },
  };

  trickHistory.forEach((trick) => {
    const winner = trick.winnerSeat;
    if (!winner || !counts[winner]) return;

    if (cId === 'sonIki' && (trick.trickNumber === 12 || trick.trickNumber === 13)) {
      counts[winner].lastTwo++;
    }

    trick.cards.forEach((tc) => {
      const card = tc.card;
      if (card.suit === 'H') counts[winner].hearts++;
      if (card.value === 12) counts[winner].queens++;
      if (card.value === 11 || card.value === 13) counts[winner].males++;
      if (card.isRifki || (card.suit === 'H' && card.value === 13)) counts[winner].rifki = true;
    });
  });

  for (const s of ['south', 'east', 'north', 'west']) {
    if (cId === 'rifki' && counts[s].rifki) {
      display[s] = '👑 RIFKI!';
    } else if (cId === 'kizAlmaz' && counts[s].queens > 0) {
      display[s] = `👸 x${counts[s].queens}`;
    } else if (cId === 'erkekAlmaz' && counts[s].males > 0) {
      display[s] = `🤴 x${counts[s].males}`;
    } else if (cId === 'kupaAlmaz' && counts[s].hearts > 0) {
      display[s] = `♥ x${counts[s].hearts}`;
    } else if (cId === 'sonIki' && counts[s].lastTwo > 0) {
      display[s] = `⌛ x${counts[s].lastTwo}`;
    }
  }

  return display;
}

export function checkEarlyRoundFinish({ contract, trickHistory = [] }) {
  if (!contract) return null;

  const cId = contract.id;

  if (cId === 'rifki') {
    for (const trick of trickHistory) {
      const rifkiCard = trick.cards.find(tc => tc.card.isRifki || (tc.card.suit === 'H' && tc.card.value === 13));
      if (rifkiCard && trick.winnerSeat) {
        return {
          shouldEnd: true,
          reason: `💥 Rıfkı ${trick.winnerName || trick.winnerSeat}'na Kaldı! (-320 Puan)`,
          victimSeat: trick.winnerSeat,
        };
      }
    }
  }

  if (cId === 'kizAlmaz') {
    let totalQueens = 0;
    trickHistory.forEach(trick => {
      trick.cards.forEach(tc => {
        if (tc.card.value === 12) totalQueens++;
      });
    });
    if (totalQueens >= 4) {
      return {
        shouldEnd: true,
        reason: '👸 4 Kızın Tamamı Yenildi! El Tamamlandı.',
      };
    }
  }

  if (cId === 'erkekAlmaz') {
    let totalMales = 0;
    trickHistory.forEach(trick => {
      trick.cards.forEach(tc => {
        if (tc.card.value === 11 || tc.card.value === 13) totalMales++;
      });
    });
    if (totalMales >= 8) {
      return {
        shouldEnd: true,
        reason: '🤴 8 Erkeğin Tamamı Yenildi! El Tamamlandı.',
      };
    }
  }

  return null;
}
