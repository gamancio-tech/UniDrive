import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

interface SaveSubscriptionInput {
  endpoint: string;
  keys: Prisma.InputJsonValue;
  studentId?: string;
  driverId?: string;
  adminId?: string;
}

export const pushSubscriptionRepository = {
  save(data: SaveSubscriptionInput) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        keys: data.keys,
        studentId: data.studentId ?? null,
        driverId: data.driverId ?? null,
        adminId: data.adminId ?? null,
      },
      create: data,
    });
  },

  listByStudentIds(studentIds: string[]) {
    return prisma.pushSubscription.findMany({
      where: { studentId: { in: studentIds } },
    });
  },

  listByDriverId(driverId: string) {
    return prisma.pushSubscription.findMany({ where: { driverId } });
  },

  listByStudentId(studentId: string) {
    return prisma.pushSubscription.findMany({ where: { studentId } });
  },

  deleteByEndpoint(endpoint: string) {
    return prisma.pushSubscription.deleteMany({ where: { endpoint } });
  },

  deleteByUserId(userId: string) {
    return prisma.pushSubscription.deleteMany({
      where: {
        OR: [
          { studentId: userId },
          { driverId: userId },
          { adminId: userId },
        ],
      },
    });
  },
};
