import { prisma } from "../lib/prisma";

export const announcementRepository = {
  create(driverId: string, message: string) {
    return prisma.announcement.create({ data: { driverId, message } });
  },

  listRecentByDriver(driverId: string, limit = 20) {
    return prisma.announcement.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
