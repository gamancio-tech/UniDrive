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

  findById(id: string) {
    return prisma.chatMessage.findUnique({
      where: { id },
    });
  },

  deleteForEveryone(id: string) {
    return prisma.chatMessage.update({
      where: { id },
      data: {
        content: "Mensagem apagada",
        deletedForEveryoneAt: new Date(),
      },
    });
  },

  hideForRole(id: string, role: "driver" | "student") {
    return prisma.chatMessage.update({
      where: { id },
      data: role === "driver" ? { hiddenForDriver: true } : { hiddenForStudent: true },
    });
  },

  hideAllForRole(driverId: string, studentId: string, role: "driver" | "student") {
    return prisma.chatMessage.updateMany({
      where: {
        driverId,
        studentId,
      },
      data: role === "driver" ? { hiddenForDriver: true } : { hiddenForStudent: true },
    });
  },

  async getHistory(
    driverId: string,
    studentId: string,
    options: { limit?: number; beforeId?: string; role?: "driver" | "student" } = {}
  ) {
    const limit = options.limit ?? 50;

    const messages = await prisma.chatMessage.findMany({
      where: {
        driverId,
        studentId,
        ...(options.role === "driver"
          ? { hiddenForDriver: false }
          : options.role === "student"
          ? { hiddenForStudent: false }
          : {}),
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
        hiddenForStudent: false,
        deletedForEveryoneAt: null,
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
        hiddenForDriver: false,
        deletedForEveryoneAt: null,
      },
    });
  },

  async countUnreadForDriver(driverId: string): Promise<number> {
    return prisma.chatMessage.count({
      where: {
        driverId,
        senderRole: "student",
        readAt: null,
        hiddenForDriver: false,
        deletedForEveryoneAt: null,
      },
    });
  },

  async getUnreadCountsGroupedByStudent(driverId: string): Promise<Map<string, number>> {
    const grouped = await prisma.chatMessage.groupBy({
      by: ["studentId"],
      where: {
        driverId,
        senderRole: "student",
        readAt: null,
        hiddenForDriver: false,
        deletedForEveryoneAt: null,
      },
      _count: {
        _all: true,
      },
    });

    const map = new Map<string, number>();
    for (const item of grouped) {
      map.set(item.studentId, item._count._all);
    }
    return map;
  },

  async getLatestMessagesPerStudent(driverId: string) {
    try {
      const messages = await prisma.$queryRaw<
        Array<{
          id: string;
          studentId: string;
          content: string;
          createdAt: Date;
          senderRole: string;
          senderId: string;
          readAt: Date | null;
          deletedForEveryoneAt: Date | null;
        }>
      >`
        SELECT DISTINCT ON ("studentId")
          id, "studentId", content, "createdAt", "senderRole", "senderId", "readAt", "deletedForEveryoneAt"
        FROM "ChatMessage"
        WHERE "driverId" = ${driverId} AND "hiddenForDriver" = false
        ORDER BY "studentId", "createdAt" DESC;
      `;

      const map = new Map<string, (typeof messages)[0]>();
      for (const msg of messages) {
        map.set(msg.studentId, msg);
      }
      return map;
    } catch (err) {
      console.warn("[chatMessageRepository] Fallback no getLatestMessagesPerStudent:", err);
      return new Map<
        string,
        {
          id: string;
          studentId: string;
          content: string;
          createdAt: Date;
          senderRole: string;
          senderId: string;
          readAt: Date | null;
          deletedForEveryoneAt: Date | null;
        }
      >();
    }
  },

  async getLatestMessage(driverId: string, studentId: string) {
    return prisma.chatMessage.findFirst({
      where: {
        driverId,
        studentId,
        hiddenForDriver: false,
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
