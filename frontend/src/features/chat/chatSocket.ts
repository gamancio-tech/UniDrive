import { authStorage } from "../../api/client";

export type ChatSocketEvent =
  | { type: "new_message"; payload: { id: string; senderId: string; senderRole: "driver" | "student"; content: string; createdAt: string; readAt: string | null } }
  | { type: "message_sent"; payload: { id: string; tempId?: string; createdAt: string; readAt: string | null } }
  | { type: "messages_read"; payload: { conversationWith: string; readAt: string } };

type Listener = (event: ChatSocketEvent) => void;
type StatusListener = (connected: boolean) => void;

class ChatSocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private reconnectTimeout: number | null = null;
  private reconnectDelay = 1000;
  private shouldReconnect = true;
  private isConnecting = false;

  private getSocketUrl(): string | null {
    const token = authStorage.getToken();
    if (!token) return null;

    const apiUrl = import.meta.env.VITE_API_URL;
    let baseWs: string;

    if (apiUrl) {
      baseWs = apiUrl.replace(/^http/, "ws");
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      baseWs = `${protocol}//${window.location.host}`;
    }

    return `${baseWs}/ws/chat?token=${token}`;
  }

  public connect() {
    if (typeof window === "undefined") return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (this.isConnecting) return;

    const url = this.getSocketUrl();
    if (!url) return;

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectDelay = 1000; // Reseta backoff
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ChatSocketEvent;
          this.notifyListeners(data);
        } catch (err) {
          console.error("[ChatSocket] Erro ao parsear mensagem:", err);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.notifyStatus(false);
        this.ws = null;

        // Se fechou por token inválido ou política (4001, 4003), não tenta reconectar em loop
        if (event.code === 4001 || event.code === 4003) {
          this.shouldReconnect = false;
          return;
        }

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.notifyStatus(false);
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
      this.connect();
    }, this.reconnectDelay);
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }

  public sendMessage(recipientId: string, content: string, tempId: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Se não conectado, tenta reconectar
      this.connect();
      return false;
    }

    this.ws.send(
      JSON.stringify({
        type: "send_message",
        payload: {
          recipientId,
          content,
          tempId,
        },
      })
    );
    return true;
  }

  public markAsRead(conversationWith: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(
      JSON.stringify({
        type: "mark_as_read",
        payload: {
          conversationWith,
        },
      })
    );
    return true;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.connect(); // Garante conexão aberta se houver ouvinte
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyListeners(event: ChatSocketEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("[ChatSocket] Erro no listener:", err);
      }
    });
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (err) {
        console.error("[ChatSocket] Erro no statusListener:", err);
      }
    });
  }
}

export const chatSocket = new ChatSocketClient();
