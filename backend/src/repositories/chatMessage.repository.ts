import { prisma } from "../lib/prisma";

export interface CreateChatMessageInput {
  driverId: string;
  studentId: string;
  senderRole: "driver" | "student";
  senderId: string;
  content: string;
}

export const chatMessageRepository = {
  create(input: CreateChatMessageInput) {
    return prisma.chatMessage.create({
      data: {
        driverId: input.driverId,
        studentId: input.studentId,
        senderRole: input.senderRole,
        senderId: input.senderId,
        content: input.content,
      },
    });
  },

  async getHistory(
    driverId: string,
    studentId: string,
    options: { limit?: number; beforeId?: string } = {}
  ) {
    const limit = options.limit ?? 50;

    const messages = await prisma.chatMessage.findMany({
      where: {
        driverId,
        studentId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(options.beforeId
        ? {
            cursor: { id: options.beforeId },
            skip: 1,
          }
        : {}),
    });

    // Retorna ordenado do mais antigo para o mais novo para renderizar na tela
    return messages.reverse();
  },

  async markAsRead(driverId: string, studentId: string, readByRole: "driver" | "student") {
    // Quem está marcando como lida é o destinatário, logo o remetente da mensagem é o outro papel
    const senderRoleToMark = readByRole === "driver" ? "student" : "driver";

    const result = await prisma.chatMessage.updateMany({
      where: {
        driverId,
        studentId,
        senderRole: senderRoleToMark,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result.count;
  },

  async countUnreadForStudent(studentId: string): Promise<number> {
    return prisma.chatMessage.count({
      where: {
        studentId,
        senderRole: "driver",
        readAt: null,
      },
    });
  },

  async countUnreadForDriverByStudent(driverId: string, studentId: string): Promise<number> {
    return prisma.chatMessage.count({
      where: {
        driverId,
        studentId,
        senderRole: "student",
        readAt: null,
      },
    });
  },

  async getLatestMessage(driverId: string, studentId: string) {
    return prisma.chatMessage.findFirst({
      where: {
        driverId,
        studentId,
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
