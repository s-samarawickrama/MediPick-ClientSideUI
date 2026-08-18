/**
 * MediPick — WebSocket API (Priority 3)
 *
 * Endpoints: A13.1
 * Design ref: MediPick_API_Design_Document.md — Section A13
 *
 * Handles real-time connections (e.g. chat messages) via socket.io-client.
 * Fully supports MOCK_MODE to allow local UI testing without a real WS server.
 */

// @ts-ignore - bypassing Metro bundler ESM resolution errors for engine.io
import io from 'socket.io-client/dist/socket.io.js';
import type { Socket } from 'socket.io-client';
import { API_BASE_URL, getAccessToken, MOCK_MODE } from './client';
import type { ChatMessage } from './messagesApi';

// ─── MOCK SOCKET ENGINE ────────────────────────────────────────────────────────

class MockSocket {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.listeners[event]) return;
    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      this.listeners[event] = [];
    }
  }

  emit(event: string, data: any) {
    // Allows the mock engine to push events to the client
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(cb => cb(data));
  }
  
  disconnect() {
    this.listeners = {};
  }
}

// Global instance exported for the mock engine (src/mock/engine.ts) to push events into
export const mockSocketEngine = new MockSocket();

// ─── WEBSOCKET CLIENT ─────────────────────────────────────────────────────────

export interface OrderSubscription {
  socket: Socket | MockSocket;
  unsubscribe: () => void;
}

/**
 * A13.1 — WSS /api/v1/orders/{orderId}/subscribe
 * Connects to the WebSocket server using the access token and joins the order's room.
 *
 * MOCK_MODE: Returns a MockSocket that the mock engine pushes events to.
 */
export async function subscribeToOrderChat(
  orderId: string,
  onNewMessage: (message: ChatMessage) => void
): Promise<OrderSubscription> {
  
  if (MOCK_MODE) {
    const handler = (msg: ChatMessage) => {
      // Ensure we only process messages for this specific order
      if (msg.orderId === orderId) {
        onNewMessage(msg);
      }
    };
    
    mockSocketEngine.on('new_message', handler);
    
    return {
      socket: mockSocketEngine,
      unsubscribe: () => mockSocketEngine.off('new_message', handler),
    };
  }

  // --- Real Backend Connection ---
  const token = await getAccessToken();
  
  // Example: Convert https://api.medipick.lk/v1 to wss://api.medipick.lk/v1
  const socketUrl = API_BASE_URL.replace(/^http/, 'ws'); 

  const socket = io(socketUrl, {
    auth: { token: `Bearer ${token}` },
    query: { orderId },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log(`[WS] Connected to chat for order ${orderId}`);
  });

  socket.on('new_message', (message: ChatMessage) => {
    onNewMessage(message);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected from chat for order ${orderId}`);
  });

  socket.on('connect_error', (err: Error) => {
    console.warn(`[WS] Connection error:`, err.message);
  });

  return {
    socket,
    unsubscribe: () => {
      socket.disconnect();
    },
  };
}
