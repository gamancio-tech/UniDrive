import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { env } from "../config/env";
import { AuthenticatedUser } from "../types/express";
import { chatService } from "../services/chat.service";
import { StatusCodeWs } from "../utils/statusCodeWs";
import { activeSockets, AuthenticatedWebSocket, chatWebSocketManager } from "./chatConnectionManager";
import { isAccountActive } from "../lib/accountStatus";

export { chatWebSocketManager } from "./chatConnectionManager";

const INTERVAL = 30000;

export function initChatWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/chat",
    maxPayload: 16 * 1024, // Limite de 16KB por frame para evitar DoS por exaustão de memória
  });

  wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
    try {
      const parsedUrl = new URL(req.url || "", "http://localhost");
      const token = parsedUrl.searchParams.get("token");

      if (!token) {
        ws.close(StatusCodeWs.UNAUTHORIZED, "Token de autenticação ausente");
        return;
      }

      let user: AuthenticatedUser;
      try {
        user = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as AuthenticatedUser;
      } catch {
        ws.close(StatusCodeWs.UNAUTHORIZED, "Token inválido ou expirado");
        return;
      }

      if (user.role !== "driver" && user.role !== "student") {
        ws.close(StatusCodeWs.FORBIDDEN, "Perfil não autorizado no chat");
        return;
      }

      const active = await isAccountActive(user.role, user.id);
      if (!active) {
        ws.close(StatusCodeWs.FORBIDDEN, "Conta desativada ou inexistente");
        return;
      }

      // Limita concorrência abusiva de abas/conexões por usuário (máx. 5)
      const userSockets = activeSockets.get(user.id);
      if (userSockets && userSockets.size >= 5) {
        ws.close(StatusCodeWs.POLICY_VIOLATION, "Limite de conexões simultâneas atingido");
        return;
      }

      ws.user = user;
      ws.isAlive = true;

      // Registra socket no mapa de conexões ativas
      if (!activeSockets.has(user.id)) {
        activeSockets.set(user.id, new Set());
      }
      activeSockets.get(user.id)!.add(ws);

      console.log(`[WebSocket Chat] Usuário conectado: ${user.id} (${user.role})`);

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Rate limit por conexão de WebSocket (máx. 20 mensagens por 10s)
      let messageCount = 0;
      let windowStart = Date.now();
      const MAX_MESSAGES_PER_WINDOW = 20;
      const WINDOW_MS = 10_000;

      ws.on("message", async (raw) => {
        try {
          const now = Date.now();
          if (now - windowStart > WINDOW_MS) {
            messageCount = 0;
            windowStart = now;
          }
          messageCount++;
          if (messageCount > MAX_MESSAGES_PER_WINDOW) {
            ws.close(StatusCodeWs.POLICY_VIOLATION, "Muitas mensagens enviadas.");
            return;
          }

          const data = JSON.parse(raw.toString());

          if (data.type === "send_message" && data.payload) {
            await chatService.handleSendMessage(user, data.payload, ws);
          } else if (data.type === "mark_as_read" && data.payload) {
            await chatService.handleMarkAsRead(user, data.payload);
          }
        } catch (err) {
          console.error("[WebSocket Chat] Erro ao processar mensagem do cliente:", err);
          ws.send(
            JSON.stringify({
              type: "error",
              payload: { message: "Erro ao processar mensagem." },
            })
          );
        }
      });

      const cleanup = () => {
        const sockets = activeSockets.get(user.id);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            activeSockets.delete(user.id);
          }
        }
        console.log(`[WebSocket Chat] Usuário desconectado: ${user.id}`);
      };

      ws.on("close", cleanup);
      ws.on("error", (err) => {
        console.error(`[WebSocket Chat] Erro no socket do usuário ${user.id}:`, err);
        cleanup();
      });
    } catch (err) {
      console.error("[WebSocket Chat] Erro na conexão inicial:", err);
      ws.close(StatusCodeWs.INTERNAL_ERROR, "Erro interno do servidor");
    }
  });

  // Heartbeat a cada 30 segundos para detectar conexões fantasmas
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AuthenticatedWebSocket;
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, INTERVAL);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}
