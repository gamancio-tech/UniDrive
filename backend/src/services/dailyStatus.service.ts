import { DailyStatusValue } from "@prisma/client";
import { dailyStatusRepository } from "../repositories/dailyStatus.repository";
import { tripCancellationRepository } from "../repositories/tripCancellation.repository";
import { env } from "../config/env";
import { pushService } from "./push.service";

/** Remove o horário, mantendo só a data — status é sempre por dia. */
function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

/** Status que indicam que o aluno vai de van hoje (Ida ou Volta). */
const IDA_STATUSES: DailyStatusValue[] = ["vai_normal", "so_ida"];
const VOLTA_STATUSES: DailyStatusValue[] = ["vai_normal", "so_volta"];

export type TripType = "ida" | "volta";
export type TripStep = "aguardando" | "em_viagem" | "finalizada";

export interface DriverTripState {
  trip: TripType;
  step: TripStep;
}

const driverTripStates = new Map<string, DriverTripState>();

function getTripKey(driverId: string, date: Date): string {
  return `${driverId}_${toDateOnly(date).toISOString().slice(0, 10)}`;
}

export const dailyStatusService = {
  getTripState(driverId: string, date: Date): DriverTripState {
    const key = getTripKey(driverId, date);
    return driverTripStates.get(key) ?? { trip: "ida", step: "aguardando" };
  },

  setTripState(driverId: string, date: Date, trip: TripType, step: TripStep): DriverTripState {
    const key = getTripKey(driverId, date);
    const updated: DriverTripState = { trip, step };
    driverTripStates.set(key, updated);
    return updated;
  },

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

    const { missingStudentIds } = await this.getMissingStudents(driverId, normalizedDate, "volta");

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

  async resetAllBoarded(driverId: string, date: Date) {
    const normalizedDate = toDateOnly(date);
    return dailyStatusRepository.resetAllBoarded(driverId, normalizedDate);
  },

  /** Verifica se o aluno já realizou o embarque na data indicada. */
  async isStudentBoarded(studentId: string, date: Date): Promise<boolean> {
    const normalizedDate = toDateOnly(date);
    const status = await dailyStatusRepository.findByStudentAndDate(studentId, normalizedDate);
    return Boolean(status?.boardedAt);
  },

  /**
   * RF02: calcula quantos e quais alunos ainda faltam embarcar no trajeto indicado (ida ou volta).
   * Aplica a regra do padrão "vai_normal" quando o aluno não definiu status (RF01)
   * e retorna null quando o dia foi cancelado pelo motorista (RF06).
   */
  async getMissingStudents(driverId: string, date: Date, trip: "ida" | "volta" = "volta") {
    const normalizedDate = toDateOnly(date);

    const cancellation = await tripCancellationRepository.findByDriverAndDate(driverId, normalizedDate);
    if (cancellation) {
      return { cancelled: true as const, missingStudentIds: [] as string[] };
    }

    const students = await dailyStatusRepository.listStudentsWithStatusForDate(driverId, normalizedDate);
    const validStatuses = trip === "ida" ? IDA_STATUSES : VOLTA_STATUSES;
    const dayOfWeek = normalizedDate.getDay();

    const missingStudentIds = students
      .filter((student) => {
        const todayStatus = student.dailyStatuses[0];
        const weeklyDefault = student.weeklySchedules.find((w) => w.dayOfWeek === dayOfWeek)?.status ?? "vai_normal";
        const status = todayStatus?.status ?? weeklyDefault;
        const isTripToday = validStatuses.includes(status);
        const alreadyBoarded = Boolean(todayStatus?.boardedAt);
        return isTripToday && !alreadyBoarded;
      })
      .map((student) => student.id);

    return { cancelled: false as const, missingStudentIds };
  },
};
