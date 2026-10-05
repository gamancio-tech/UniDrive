import { DailyStatusValue } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface WeeklyScheduleItemInput {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  status: DailyStatusValue;
}

export const studentWeeklyScheduleRepository = {
  /** Lista todas as configurações de dia padrão de um aluno */
  findByStudentId(studentId: string) {
    return prisma.studentWeeklySchedule.findMany({
      where: { studentId },
      orderBy: { dayOfWeek: "asc" },
    });
  },

  /** Busca o status padrão de um aluno para um dia específico da semana */
  findByStudentAndDay(studentId: string, dayOfWeek: number) {
    return prisma.studentWeeklySchedule.findUnique({
      where: {
        studentId_dayOfWeek: {
          studentId,
          dayOfWeek,
        },
      },
    });
  },

  /** Salva ou atualiza a rotina semanal completa do aluno em transação */
  async saveMany(studentId: string, items: WeeklyScheduleItemInput[]) {
    return prisma.$transaction(
      items.map((item) =>
        prisma.studentWeeklySchedule.upsert({
          where: {
            studentId_dayOfWeek: {
              studentId,
              dayOfWeek: item.dayOfWeek,
            },
          },
          update: {
            status: item.status,
          },
          create: {
            studentId,
            dayOfWeek: item.dayOfWeek,
            status: item.status,
          },
        })
      )
    );
  },
};
