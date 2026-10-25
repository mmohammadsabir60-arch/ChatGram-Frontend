import { chatApi } from '@/api/chat';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:7860/ws';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected';
type EventCallback = (data: any) => void;

interface QueuedMessage {
  event: string;
  data: any;
}

class ChatgramSocket {
  private ws: WebSocket | null = null;
  private status: SocketStatus = 'disconnected';
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private statusListeners: Set<(status: SocketStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private offlineQueue: QueuedMessage[] = [];
  private isIntentionallyClosed = false;

  public get currentStatus(): SocketStatus {
    return this.status;
  }

  public onStatusChange(callback: (status: SocketStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(newStatus: SocketStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((cb) => cb(newStatus));
    }
  }

  public async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') return;
    this.isIntentionallyClosed = false;
    this.setStatus('connecting');

    try {
      const ticketRes = await chatApi.getWsTicket();
      const ticket = ticketRes.ticket;
      const url = `${WS_BASE}?ticket=${encodeURIComponent(ticket)}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.flushOfflineQueue();
        this.emit('socket.reconnected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: evt, data } = payload;

          if (evt === 'ping') {
            this.send('pong', {});
            return;
          }

          this.emit(evt, data);
        } catch (err) {
          console.error('[WS] Parse error', err);
        }
      };

      this.ws.onclose = () => {
        this.cleanup();
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Error', err);
        this.ws?.close();
      };
    } catch (err) {
      console.warn('[WS] Ticket acquisition failed', err);
      this.cleanup();
      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
    }
  }

  private cleanup() {
    this.setStatus('disconnected');
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;
    // Exponential backoff with ceiling at 15s and jitter
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000) + Math.random() * 500;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }

  public send(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      // Buffer outgoing messages in offline queue
      if (event === 'message.send') {
        this.offlineQueue.push({ event, data });
      }
    }
  }

  private flushOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    const queued = [...this.offlineQueue];
    this.offlineQueue = [];
    queued.forEach((item) => {
      this.send(item.event, item.data);
    });
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(`[WS] Error in listener for event ${event}:`, e);
      }
    });
  }
}

export const socketService = new ChatgramSocket();

