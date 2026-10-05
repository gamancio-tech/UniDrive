import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const chatRoutes = Router();

chatRoutes.use(authMiddleware);

// Histórico de mensagens da conversa com um parceiro específico
chatRoutes.get("/history/:partnerId", chatController.getHistory);

// Lista de conversas com alunos e unread count (exclusivo motorista)
chatRoutes.get("/conversations", requireRole("driver"), chatController.getConversations);

// Contador de mensagens pendentes (para o aluno exibir badge)
chatRoutes.get("/unread-count", requireRole("student"), chatController.getUnreadCount);
