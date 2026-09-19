import { DailyStatusValue } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const dailyStatusRepository = {
  findByStudentAndDate(studentId: string, date: Date) {
    return prisma.dailyStatus.findUnique({
      where: { studentId_date: { studentId, date } },
    });
  },

  /** Cria ou atualiza o status do aluno para o dia (RF01). */
  upsertStatus(studentId: string, date: Date, status: DailyStatusValue) {
    return prisma.dailyStatus.upsert({
      where: { studentId_date: { studentId, date } },
      update: { status },
      create: { studentId, date, status },
    });
  },

  /** Marca o embarque do aluno no dia (RF04), preservando o status já definido. */
  markBoarded(studentId: string, date: Date) {
    return prisma.dailyStatus.upsert({
      where: { studentId_date: { studentId, date } },
      update: { boardedAt: new Date() },
      create: { studentId, date, boardedAt: new Date() },
    });
  },

  /**
   * Lista os alunos ativos do motorista junto com o status do dia (se existir).
   * Quando não existe registro para a data, o aluno não vem com dailyStatuses —
   * a camada de serviço aplica a regra do padrão "vai_normal" (ver docs/03-modelo-dados.md).
   */
  listStudentsWithStatusForDate(driverId: string, date: Date) {
    return prisma.student.findMany({
      where: { driverId, active: true },
      include: {
        dailyStatuses: { where: { date } },
      },
    });
  },
};
