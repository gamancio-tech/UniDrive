import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

interface SaveSubscriptionInput {
  endpoint: string;
  keys: Prisma.InputJsonValue;
  studentId?: string;
  driverId?: string;
  adminId?: string;
}

import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const pushSubscriptionRepository = {
  async save(data: SaveSubscriptionInput) {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: data.endpoint },
    });

    if (existing) {
      const isOwner =
        (data.studentId && existing.studentId === data.studentId) ||
        (data.driverId && existing.driverId === data.driverId) ||
        (data.adminId && existing.adminId === data.adminId);

      if (!isOwner) {
        throw new AppError("Inscrição push já vinculada a outro usuário.", StatusCodeHttp.CONFLICT);
      }

      return prisma.pushSubscription.update({
        where: { endpoint: data.endpoint },
        data: {
          keys: data.keys,
        },
      });
    }

    return prisma.pushSubscription.create({
      data,
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

  /** Remove a inscrição apenas se ela pertencer ao usuário informado. */
  deleteByEndpointAndUser(endpoint: string, userId: string) {
    return prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        OR: [{ studentId: userId }, { driverId: userId }, { adminId: userId }],
      },
    });
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
