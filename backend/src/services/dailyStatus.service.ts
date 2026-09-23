import { DailyStatusValue } from "@prisma/client";
import { dailyStatusRepository } from "../repositories/dailyStatus.repository";
import { tripCancellationRepository } from "../repositories/tripCancellation.repository";
import { env } from "../config/env";
import { pushService } from "./push.service";

/** Remove o horário, mantendo só a data — status é sempre por dia. */
function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

/** Status que indicam que o aluno volta de van hoje (relevantes para o contador da volta). */
const RETURNING_STATUSES: DailyStatusValue[] = ["vai_normal", "so_volta"];

export const dailyStatusService = {
  /** RF01: aluno define o status do dia (padrão é "vai_normal" quando nunca definido). */
  async setStatus(studentId: string, date: Date, status: DailyStatusValue) {
    return dailyStatusRepository.upsertStatus(studentId, toDateOnly(date), status);
  },

  /**
   * RF04: marca o embarque do aluno (pode ser chamado pelo próprio aluno ou pelo motorista).
   * Depois de marcar, verifica se o número de faltantes ficou baixo o suficiente para notificar (RF03).
   */
  async checkIn(studentId: string, date: Date, driverId: string) {
    const normalizedDate = toDateOnly(date);
    const updated = await dailyStatusRepository.markBoarded(studentId, normalizedDate);

    const { missingStudentIds } = await this.getMissingStudents(driverId, normalizedDate);

    if (missingStudentIds.length > 0 && missingStudentIds.length <= env.missingCountNotificationThreshold) {
      // NOTA para quem for evoluir: isso pode notificar repetidamente a cada novo check-in
      // enquanto a contagem estiver dentro do limite. Numa iteração futura, vale guardar
      // "último valor notificado" para disparar só na transição.
      await pushService.notifyStudents(missingStudentIds, {
        title: "A van está quase saindo",
        body: `Faltam ${missingStudentIds.length} aluno(s) para embarcar.`,
      });
    }

    return updated;
  },

  async cancelBoarded(studentId: string, date: Date) {
    const normalizedDate = toDateOnly(date);
    const updated = await dailyStatusRepository.cancelBoarded(studentId, normalizedDate);

    return updated;
  },

  /**
   * RF02: calcula quantos e quais alunos ainda faltam embarcar na volta de hoje.
   * Aplica a regra do padrão "vai_normal" quando o aluno não definiu status (RF01)
   * e retorna null quando o dia foi cancelado pelo motorista (RF06).
   */
  async getMissingStudents(driverId: string, date: Date) {
    const normalizedDate = toDateOnly(date);

    const cancellation = await tripCancellationRepository.findByDriverAndDate(driverId, normalizedDate);
    if (cancellation) {
      return { cancelled: true as const, missingStudentIds: [] as string[] };
    }

    const students = await dailyStatusRepository.listStudentsWithStatusForDate(driverId, normalizedDate);

    const missingStudentIds = students
      .filter((student) => {
        const todayStatus = student.dailyStatuses[0];
        const status = todayStatus?.status ?? "vai_normal"; // padrão quando não há registro
        const isReturningToday = RETURNING_STATUSES.includes(status);
        const alreadyBoarded = Boolean(todayStatus?.boardedAt);
        return isReturningToday && !alreadyBoarded;
      })
      .map((student) => student.id);

    return { cancelled: false as const, missingStudentIds };
  },
};
