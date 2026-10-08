import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  chatHistorySchema,
  chatPartnerParamSchema,
  deleteChatMessageSchema,
  classQuerySchema,
} from "../schemas";
import { chatDeletionLimiter, chatClearLimiter } from "../middlewares/rateLimiter.middleware";

export const chatRoutes = Router();

chatRoutes.use(authMiddleware);

// Histórico de mensagens da conversa com um parceiro específico
chatRoutes.get("/history/:partnerId", validate(chatHistorySchema), chatController.getHistory);

// Exclusão de mensagem específica (para mim ou para todos) - com rate limit dedicado
chatRoutes.delete(
  "/messages/:id",
  chatDeletionLimiter,
  validate(deleteChatMessageSchema),
  chatController.deleteMessage
);

// Limpeza do histórico completo de conversa (apenas para o usuário logado) - com rate limit dedicado
chatRoutes.delete(
  "/history/:partnerId",
  chatClearLimiter,
  validate(chatPartnerParamSchema),
  chatController.clearConversation
);

// Lista de conversas / contatos com alunos e unread count (exclusivo motorista, com filtro opcional de classId)
chatRoutes.get(
  "/conversations",
  requireRole("driver"),
  validate(classQuerySchema),
  chatController.getConversations
);
chatRoutes.get(
  "/contacts",
  requireRole("driver"),
  validate(classQuerySchema),
  chatController.getConversations
);

// Contador de mensagens pendentes (para aluno ou motorista exibir badge)
chatRoutes.get("/unread-count", chatController.getUnreadCount);

