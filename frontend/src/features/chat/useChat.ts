import { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessage, getChatHistory } from "../../api/chat";
import { getDecodedToken } from "../../api/client";
import { chatSocket, ChatSocketEvent } from "./chatSocket";

interface UseChatOptions {
  partnerId: string;
  autoMarkRead?: boolean;
}

export function useChat({ partnerId, autoMarkRead = true }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(chatSocket.isConnected());

  const user = getDecodedToken();
  const myId = user?.id || "";
  const role = (user?.role || "student") as "driver" | "student";

  const partnerIdRef = useRef(partnerId);
  partnerIdRef.current = partnerId;

  // Carrega o histórico inicial de mensagens
  const loadHistory = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const history = await getChatHistory(partnerId, 50);
      setMessages(history);
      setHasMore(history.length >= 50);

      // Marca mensagens recebidas como lidas
      if (autoMarkRead) {
        chatSocket.markAsRead(partnerId);
      }
    } catch (err) {
      console.error("[useChat] Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  }, [partnerId, autoMarkRead]);

  // Carrega mensagens mais antigas (scroll para cima)
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingOlder || messages.length === 0 || !partnerId) return;

    const oldestMessage = messages[0];
    setLoadingOlder(true);
    try {
      const older = await getChatHistory(partnerId, 30, oldestMessage.id);
      if (older.length < 30) {
        setHasMore(false);
      }
      setMessages((prev) => [...older, ...prev]);
    } catch (err) {
      console.error("[useChat] Erro ao carregar mensagens antigas:", err);
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, messages, partnerId]);

  // Envia mensagem otimista e despacha via WebSocket
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !partnerId) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const optimistic: ChatMessage = {
        id: tempId,
        tempId,
        driverId: role === "driver" ? myId : partnerId,
        studentId: role === "student" ? myId : partnerId,
        senderRole: role,
        senderId: myId,
        content: trimmed,
        readAt: null,
        createdAt: nowIso,
        status: "sending",
      };

      setMessages((prev) => [...prev, optimistic]);

      const sent = chatSocket.sendMessage(partnerId, trimmed, tempId);
      if (!sent) {
        // Marca como erro se o socket estiver desconectado
        setMessages((prev) =>
          prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: "error" } : msg))
        );
      }
    },
    [partnerId, role, myId]
  );

  const markAsRead = useCallback(() => {
    if (!partnerId) return;
    chatSocket.markAsRead(partnerId);
  }, [partnerId]);

  // Conexão e listeners do WebSocket
  useEffect(() => {
    loadHistory();

    const unsubStatus = chatSocket.onStatusChange((connected) => {
      setIsConnected(connected);
    });

    const unsubEvents = chatSocket.subscribe((event: ChatSocketEvent) => {
      const currentPartner = partnerIdRef.current;
      if (!currentPartner) return;

      if (event.type === "new_message") {
        const payload = event.payload;
        // Mensagem recebida deste parceiro
        if (payload.senderId === currentPartner) {
          const newMsg: ChatMessage = {
            id: payload.id,
            driverId: role === "driver" ? myId : currentPartner,
            studentId: role === "student" ? myId : currentPartner,
            senderRole: payload.senderRole,
            senderId: payload.senderId,
            content: payload.content,
            readAt: payload.readAt,
            createdAt: payload.createdAt,
            status: "sent",
          };

          setMessages((prev) => {
            // Evita duplicatas se já existe pelo id
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (autoMarkRead) {
            chatSocket.markAsRead(currentPartner);
          }
        }
      } else if (event.type === "message_sent") {
        const payload = event.payload;
        // Atualiza mensagem otimista pelo tempId
        if (payload.tempId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.tempId === payload.tempId
                ? {
                    ...msg,
                    id: payload.id,
                    createdAt: payload.createdAt,
                    readAt: payload.readAt,
                    status: "sent",
                  }
                : msg
            )
          );
        }
      } else if (event.type === "messages_read") {
        const payload = event.payload;
        // O destinatário visualizou as mensagens enviadas
        if (payload.conversationWith === currentPartner) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.senderId === myId && !msg.readAt
                ? { ...msg, readAt: payload.readAt }
                : msg
            )
          );
        }
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [loadHistory, autoMarkRead, myId, role]);

  return {
    messages,
    loading,
    loadingOlder,
    hasMore,
    isConnected,
    sendMessage,
    markAsRead,
    loadOlderMessages,
    reload: loadHistory,
  };
}
