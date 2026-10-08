import { prisma } from "../lib/prisma";

export const announcementRepository = {
  create(driverId: string, classId: string, message: string) {
    return prisma.announcement.create({
      data: { driverId, classId, message },
      include: {
        class: { select: { id: true, name: true } },
      },
    });
  },

  listRecentByDriver(driverId: string, classId?: string, limit = 20) {
    return prisma.announcement.findMany({
      where: {
        driverId,
        ...(classId ? { classId } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  listRecentByClass(classId: string, limit = 20) {
    return prisma.announcement.findMany({
      where: { classId },
      include: {
        class: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
