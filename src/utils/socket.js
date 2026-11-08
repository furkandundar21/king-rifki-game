import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const hostname = window.location.hostname;
    const serverUrl = window.location.port === '5173'
      ? `http://${hostname}:3001`
      : window.location.origin;

    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Sunucuya bağlandı:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Bağlantı kesildi:', reason);
    });
  }

  return socket;
}
