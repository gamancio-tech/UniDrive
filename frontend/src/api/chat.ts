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
  tempId?: string;
  status?: "sending" | "sent" | "error";
}

export interface ConversationSummary {
  studentId: string;
  studentName: string;
  studentPhotoUrl: string | null;
  studentPhone?: string | null;
  todayStatus?: string;
  isBoarded?: boolean;
  latestMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderRole: "driver" | "student";
    senderId: string;
    readAt: string | null;
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
 * Retorna as conversas ativas do motorista com resumo e contador de não lidas
 */
export async function getDriverConversations(): Promise<ConversationSummary[]> {
  return apiRequest<ConversationSummary[]>("/chat/conversations");
}

/**
 * Retorna o número de mensagens pendentes do motorista para o aluno
 */
export async function getStudentUnreadCount(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>("/chat/unread-count");
}
