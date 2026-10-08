import { apiRequest } from "./client";

export interface ChatMessage {
  id: string;
  driverId: string;
  studentId: string;
  senderRole: "driver" | "student";
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  deletedForEveryoneAt?: string | null;
  tempId?: string;
  status?: "sending" | "sent" | "error";
}

export interface ConversationSummary {
  studentId: string;
  studentName: string;
  studentPhotoUrl: string | null;
  studentPhone?: string | null;
  classId?: string;
  className?: string;
  todayStatus?: string;
  isBoarded?: boolean;
  latestMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderRole: "driver" | "student";
    senderId: string;
    readAt: string | null;
    deletedForEveryoneAt?: string | null;
  } | null;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Carrega o histórico de mensagens trocadas com o parceiro de conversa
 */
export async function getChatHistory(
  partnerId: string,
  limit = 50,
  beforeId?: string
): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (beforeId) params.set("beforeId", beforeId);

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<ChatMessage[]>(`/chat/history/${partnerId}${query}`);
}

/**
 * Exclui uma mensagem específica (só para você ou para todos)
 */
export async function deleteChatMessage(
  messageId: string,
  scope: "me" | "everyone" = "me"
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/chat/messages/${messageId}?scope=${scope}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Limpa todas as mensagens da conversa com um parceiro somente para você
 */
export async function clearChatHistory(
  partnerId: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/chat/history/${partnerId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Retorna as conversas ativas do motorista com resumo e contador de não lidas (opcionalmente filtrado por turma)
 */
export async function getDriverConversations(classId?: string): Promise<ConversationSummary[]> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  return apiRequest<ConversationSummary[]>(`/chat/conversations${query}`);
}

/**
 * Retorna o número de mensagens pendentes (para motorista ou aluno)
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>("/chat/unread-count");
}

export const getStudentUnreadCount = getUnreadCount;
