import { NextFunction, Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { hasRole } from "../utils/roles";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const chatController = {
  /**
   * GET /api/chat/history/:partnerId
   * Retorna o histórico de mensagens entre o usuário logado e o parceiro de conversa
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado." });
      }

      const { partnerId } = req.params;
      if (!partnerId) {
        return res.status(StatusCodeHttp.BAD_REQUEST).json({ error: "Identificador do destinatário obrigatório." });
      }

      const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 50;
      const beforeId = req.query.beforeId ? String(req.query.beforeId) : undefined;

      const messages = await chatService.getHistory(req.user, partnerId, { limit, beforeId });
      return res.json(messages);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/chat/messages/:id?scope=me|everyone
   * Exclui uma mensagem específica (só para você ou para todos)
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado." });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(StatusCodeHttp.BAD_REQUEST).json({ error: "Identificador da mensagem obrigatório." });
      }

      const scope = req.query.scope === "everyone" ? "everyone" : "me";
      await chatService.deleteMessage(req.user, id, scope);

      return res.json({ success: true, message: "Mensagem excluída com sucesso." });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/chat/history/:partnerId
   * Limpa todas as mensagens da conversa com um parceiro somente para o usuário logado
   */
  async clearConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado." });
      }

      const { partnerId } = req.params;
      if (!partnerId) {
        return res.status(StatusCodeHttp.BAD_REQUEST).json({ error: "Identificador da conversa obrigatório." });
      }

      await chatService.clearConversation(req.user, partnerId);
      return res.json({ success: true, message: "Conversa limpa com sucesso." });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/chat/conversations
   * Retorna a lista de conversas com alunos e mensagens não lidas (exclusivo para motorista)
   */
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado." });
      }

      if (!hasRole(req.user, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem acessar a lista de conversas." });
      }

      const classId = req.query.classId as string | undefined;
      const conversations = await chatService.getDriverConversations(req.user.id, classId);
      return res.json(conversations);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/chat/unread-count
   * Retorna a contagem de mensagens não lidas para o usuário logado (aluno ou motorista)
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado." });
      }

      if (hasRole(req.user, "student")) {
        const result = await chatService.getStudentUnreadCount(req.user.id);
        return res.json(result);
      }

      if (hasRole(req.user, "driver")) {
        const result = await chatService.getDriverUnreadCount(req.user.id);
        return res.json(result);
      }

      return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Perfil não autorizado." });
    } catch (err) {
      next(err);
    }
  },
};
