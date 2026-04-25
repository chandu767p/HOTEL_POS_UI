import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO server');
    });

    // Re-attach all listeners on reconnect
    this.socket.on('reconnect', () => {
      this.listeners.forEach((callback, event) => {
        this.socket.on(event, callback);
      });
    });
  }

  on(event, callback) {
    if (!this.socket) this.connect();
    
    // Remove existing listener if any
    if (this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
    }

    this.listeners.set(event, callback);
    this.socket.on(event, callback);
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }
}

const socketService = new SocketService();
export default socketService;
