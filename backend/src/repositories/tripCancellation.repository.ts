import { prisma } from "../lib/prisma";

export const tripCancellationRepository = {
  findByDriverAndDate(driverId: string, date: Date) {
    return prisma.tripCancellation.findUnique({
      where: { driverId_date: { driverId, date } },
    });
  },

  /** Cancela o dia inteiro para o motorista (RF06). */
  create(driverId: string, date: Date, reason?: string) {
    return prisma.tripCancellation.upsert({
      where: { driverId_date: { driverId, date } },
      update: { reason },
      create: { driverId, date, reason },
    });
  },

  /** Remove o cancelamento do dia para o motorista, reativando a viagem (RF06). */
  delete(driverId: string, date: Date) {
    return prisma.tripCancellation.deleteMany({
      where: { driverId, date },
    });
  },
};
