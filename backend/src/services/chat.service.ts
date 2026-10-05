import { WebSocket } from "ws";
import { chatMessageRepository } from "../repositories/chatMessage.repository";
import { driverRepository } from "../repositories/driver.repository";
import { studentRepository } from "../repositories/student.repository";
import { studentService } from "./student.service";
import { AuthenticatedUser, StudentUser } from "../types/express";
import { pushService } from "./push.service";
import { chatWebSocketManager } from "../websocket/chatConnectionManager";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export interface SendMessagePayload {
  recipientId: string;
  content: string;
  tempId?: string;
}

export interface MarkAsReadPayload {
  conversationWith: string;
}

export const chatService = {
  async handleSendMessage(
    user: AuthenticatedUser,
    payload: SendMessagePayload,
    originWs?: WebSocket
  ) {
    const content = payload.content?.trim();
    if (!content) {
      throw new AppError("O conteúdo da mensagem não pode ser vazio.", StatusCodeHttp.BAD_REQUEST);
    }
    if (content.length > 1000) {
      throw new AppError("O conteúdo da mensagem não pode ultrapassar 1000 caracteres.", StatusCodeHttp.BAD_REQUEST);
    }

    let driverId = "";
    let studentId = "";
    const senderRole = user.role as "driver" | "student";
    const senderId = user.id;

    if (user.role === "student") {
      studentId = user.id;
      const studentUser = user as StudentUser;
      let targetDriverId = studentUser.driverId;

      if (!targetDriverId) {
        const student = await studentRepository.findById(user.id);
        if (!student) {
          throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
        }
        targetDriverId = student.driverId;
      }

      driverId = targetDriverId;
    } else if (user.role === "driver") {
      driverId = user.id;
      studentId = payload.recipientId;

      const student = await studentRepository.findById(studentId);
      if (!student || student.driverId !== driverId) {
        throw new AppError("Destinatário inválido ou não pertence a este motorista.", StatusCodeHttp.BAD_REQUEST);
      }
    } else {
      throw new AppError("Apenas motoristas e alunos podem enviar mensagens.", StatusCodeHttp.FORBIDDEN);
    }

    const saved = await chatMessageRepository.create({
      driverId,
      studentId,
      senderRole,
      senderId,
      content,
    });

    // Confirma envio para a conexão remetente
    if (originWs && originWs.readyState === WebSocket.OPEN) {
      originWs.send(
        JSON.stringify({
          type: "message_sent",
          payload: {
            id: saved.id,
            tempId: payload.tempId,
            createdAt: saved.createdAt.toISOString(),
            readAt: saved.readAt,
          },
        })
      );
    }

    const recipientId = user.role === "student" ? driverId : studentId;
    const isRecipientOnline = chatWebSocketManager.isUserConnected(recipientId);

    if (isRecipientOnline) {
      // Destinatário online: entrega instantânea via WebSocket
      chatWebSocketManager.sendToUser(recipientId, {
        type: "new_message",
        payload: {
          id: saved.id,
          senderId: saved.senderId,
          senderRole: saved.senderRole,
          content: saved.content,
          createdAt: saved.createdAt.toISOString(),
          readAt: saved.readAt,
        },
      });
    } else {
      // Destinatário offline: fallback para Notificação Push no celular
      try {
        if (senderRole === "student") {
          const student = await studentRepository.findById(user.id);
          const senderName = student?.name || "Aluno";
          await pushService.notifyDriver(driverId, {
            title: `💬 Nova mensagem de ${senderName}`,
            body: saved.content.length > 70 ? `${saved.content.slice(0, 70)}...` : saved.content,
            tag: `chat-${studentId}`,
            url: "/?tab=chat",
          });
        } else {
          const driver = await driverRepository.findById(user.id);
          const senderName = driver?.name || "Motorista";
          await pushService.notifyStudents([studentId], {
            title: `💬 Nova mensagem de ${senderName}`,
            body: saved.content.length > 70 ? `${saved.content.slice(0, 70)}...` : saved.content,
            tag: `chat-${driverId}`,
            url: "/?tab=chat",
          });
        }
      } catch (err) {
        console.error("[Chat Push] Falha ao enviar notificação push:", err);
      }
    }

    return saved;
  },

  async handleMarkAsRead(user: AuthenticatedUser, payload: MarkAsReadPayload) {
    if (!payload.conversationWith) return;

    let driverId = "";
    let studentId = "";
    const readByRole = user.role as "driver" | "student";

    if (user.role === "driver") {
      driverId = user.id;
      studentId = payload.conversationWith;

      const student = await studentRepository.findById(studentId);
      if (!student || student.driverId !== driverId) {
        return;
      }
    } else if (user.role === "student") {
      studentId = user.id;
      const studentUser = user as StudentUser;
      driverId = payload.conversationWith || studentUser.driverId;

      if (!driverId) {
        const student = await studentRepository.findById(user.id);
        driverId = student?.driverId ?? "";
      }

      if (!driverId || payload.conversationWith !== driverId) {
        return;
      }
    } else {
      return;
    }

    const updatedCount = await chatMessageRepository.markAsRead(driverId, studentId, readByRole);

    if (updatedCount > 0) {
      const readAt = new Date().toISOString();
      chatWebSocketManager.sendToUser(payload.conversationWith, {
        type: "messages_read",
        payload: {
          conversationWith: user.id,
          readAt,
        },
      });
    }
  },

  async getHistory(
    user: AuthenticatedUser,
    partnerId: string,
    options: { limit?: number; beforeId?: string } = {}
  ) {
    let driverId = "";
    let studentId = "";

    if (user.role === "driver") {
      driverId = user.id;
      studentId = partnerId;
    } else if (user.role === "student") {
      studentId = user.id;
      const studentUser = user as StudentUser;
      driverId = partnerId || studentUser.driverId;

      if (!driverId) {
        const student = await studentRepository.findById(user.id);
        driverId = student?.driverId ?? "";
      }
    } else {
      throw new AppError("Acesso não permitido.", StatusCodeHttp.FORBIDDEN);
    }

    return chatMessageRepository.getHistory(driverId, studentId, options);
  },

  async getDriverConversations(driverId: string) {
    const students = await studentService.list(driverId);
    if (!students || students.length === 0) return [];

    const [latestMessagesMap, unreadCountsMap] = await Promise.all([
      chatMessageRepository.getLatestMessagesPerStudent(driverId),
      chatMessageRepository.getUnreadCountsGroupedByStudent(driverId),
    ]);

    const conversations = students.map((student) => {
      const latestMessage = latestMessagesMap.get(student.id);
      const unreadCount = unreadCountsMap.get(student.id) || 0;

      return {
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        studentPhotoUrl: student.photoUrl,
        todayStatus: student.todayStatus,
        isBoarded: student.isBoarded,
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              createdAt:
                latestMessage.createdAt instanceof Date
                  ? latestMessage.createdAt.toISOString()
                  : String(latestMessage.createdAt),
              senderRole: latestMessage.senderRole,
              senderId: latestMessage.senderId,
              readAt: latestMessage.readAt
                ? latestMessage.readAt instanceof Date
                  ? latestMessage.readAt.toISOString()
                  : String(latestMessage.readAt)
                : null,
            }
          : null,
        unreadCount,
      };
    });

    // Ordenação: conversas com mensagens recentes primeiro; caso sem mensagem, por ordem alfabética
    conversations.sort((a, b) => {
      const timeA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const timeB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;

      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return a.studentName.localeCompare(b.studentName);
    });

    return conversations;
  },

  async getDriverUnreadCount(driverId: string) {
    const unreadCount = await chatMessageRepository.countUnreadForDriver(driverId);
    return { unreadCount };
  },

  async getStudentUnreadCount(studentId: string) {
    const unreadCount = await chatMessageRepository.countUnreadForStudent(studentId);
    return { unreadCount };
  },
};
