import { prisma } from "../lib/prisma";

export const tripCancellationRepository = {
  findByClassAndDate(classId: string, date: Date) {
    return prisma.tripCancellation.findUnique({
      where: { classId_date: { classId, date } },
    });
  },

  listByDriverAndDate(driverId: string, date: Date) {
    return prisma.tripCancellation.findMany({
      where: { driverId, date },
    });
  },

  /** Cancela o dia para a turma indicada (RF06). */
  create(driverId: string, classId: string, date: Date, reason?: string) {
    return prisma.tripCancellation.upsert({
      where: { classId_date: { classId, date } },
      update: { reason },
      create: { driverId, classId, date, reason },
    });
  },

  /** Remove o cancelamento do dia para uma turma (RF06). */
  delete(classId: string, date: Date) {
    return prisma.tripCancellation.deleteMany({
      where: { classId, date },
    });
  },

  /** Remove o cancelamento do dia para turmas específicas do motorista. */
  deleteManyByClasses(driverId: string, classIds: string[], date: Date) {
    return prisma.tripCancellation.deleteMany({
      where: {
        driverId,
        date,
        classId: { in: classIds },
      },
    });
  },
};
