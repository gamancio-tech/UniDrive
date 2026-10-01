import { MarkedBy } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const paymentRepository = {
  findOrCreateCycle(studentId: string, referenceMonth: Date, reminderDaysBefore: number) {
    return prisma.paymentCycle.upsert({
      where: { studentId_referenceMonth: { studentId, referenceMonth } },
      update: {},
      create: { studentId, referenceMonth, reminderDaysBefore },
    });
  },

  requestPayment(studentId: string, referenceMonth: Date) {
    return prisma.paymentCycle.update({
      where: { studentId_referenceMonth: { studentId, referenceMonth } },
      data: { paymentRequestedAt: new Date() },
    });
  },

  rejectPayment(studentId: string, referenceMonth: Date) {
    return prisma.paymentCycle.update({
      where: { studentId_referenceMonth: { studentId, referenceMonth } },
      data: { paymentRequestedAt: null },
    });
  },

  markPaid(studentId: string, referenceMonth: Date, markedBy: MarkedBy) {
    return prisma.paymentCycle.update({
      where: { studentId_referenceMonth: { studentId, referenceMonth } },
      data: { paidAt: new Date(), markedBy },
    });
  },

  listByStudent(studentId: string) {
    return prisma.paymentCycle.findMany({
      where: { studentId },
      orderBy: { referenceMonth: "desc" },
    });
  },

  updateReminderDays(studentId: string, referenceMonth: Date, reminderDaysBefore: number) {
    return prisma.paymentCycle.update({
      where: { studentId_referenceMonth: { studentId, referenceMonth } },
      data: { reminderDaysBefore },
    });
  },
};
