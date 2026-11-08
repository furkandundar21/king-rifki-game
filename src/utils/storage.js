// LocalStorage oturum yönetimi

const STORAGE_KEY = 'king_game_session';

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Session okunamadı:', e);
    return null;
  }
}

export function saveSession({ playerId, playerName, roomPin, seat }) {
  try {
    const current = getStoredSession() || {};
    const updated = {
      ...current,
      playerId: playerId || current.playerId || generatePlayerId(),
      playerName: playerName || current.playerName || '',
      roomPin: roomPin || current.roomPin || '1923',
      seat: seat || current.seat || 'south',
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Session kaydedilemedi:', e);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Session temizlenemedi:', e);
  }
}

export function generatePlayerId() {
  return 'p_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
