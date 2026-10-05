import { WebSocket } from "ws";
import { AuthenticatedUser } from "../types/express";

export interface AuthenticatedWebSocket extends WebSocket {
  user?: AuthenticatedUser;
  isAlive?: boolean;
}

// Mapeia userId -> Conjunto de WebSockets ativos (para suportar múltiplas abas)
export const activeSockets = new Map<string, Set<AuthenticatedWebSocket>>();

export const chatWebSocketManager = {
  /**
   * Envia uma mensagem JSON para todas as conexões ativas de um determinado usuário
   */
  sendToUser(userId: string, data: unknown): boolean {
    const sockets = activeSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;

    const payload = JSON.stringify(data);
    let delivered = false;

    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
        delivered = true;
      }
    }
    return delivered;
  },

  /**
   * Verifica se o usuário possui pelo menos uma conexão ativa no chat
   */
  isUserConnected(userId: string): boolean {
    const sockets = activeSockets.get(userId);
    if (!sockets) return false;
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        return true;
      }
    }
    return false;
  },
};
