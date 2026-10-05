import { DailyStatusValue } from "@prisma/client";
import {
  studentWeeklyScheduleRepository,
  WeeklyScheduleItemInput,
} from "../repositories/studentWeeklySchedule.repository";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

const VALID_STATUSES: DailyStatusValue[] = ["vai_normal", "so_ida", "so_volta", "nao_vai"];

export interface WeeklyScheduleDayDto {
  dayOfWeek: number; // 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  dayName: string;
  status: DailyStatusValue;
}

const DEFAULT_DAYS = [
  { dayOfWeek: 1, dayName: "Segunda-feira" },
  { dayOfWeek: 2, dayName: "Terça-feira" },
  { dayOfWeek: 3, dayName: "Quarta-feira" },
  { dayOfWeek: 4, dayName: "Quinta-feira" },
  { dayOfWeek: 5, dayName: "Sexta-feira" },
  { dayOfWeek: 6, dayName: "Sábado" },
];

export const studentWeeklyScheduleService = {
  /**
   * Retorna a rotina semanal padrão completa do aluno.
   * Se o aluno ainda não configurou algum dia, retorna o padrão "vai_normal".
   */
  async getSchedule(studentId: string): Promise<WeeklyScheduleDayDto[]> {
    const saved = await studentWeeklyScheduleRepository.findByStudentId(studentId);
    const map = new Map<number, DailyStatusValue>();
    saved.forEach((item) => map.set(item.dayOfWeek, item.status));

    return DEFAULT_DAYS.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      dayName: day.dayName,
      status: map.get(day.dayOfWeek) ?? "vai_normal",
    }));
  },

  /**
   * Atualiza a rotina semanal de um aluno.
   */
  async updateSchedule(studentId: string, items: WeeklyScheduleItemInput[]) {
    if (!Array.isArray(items)) {
      throw new AppError("O cronograma semanal deve ser uma lista de dias.", StatusCodeHttp.BAD_REQUEST);
    }

    for (const item of items) {
      if (typeof item.dayOfWeek !== "number" || item.dayOfWeek < 0 || item.dayOfWeek > 6) {
        throw new AppError(`Dia da semana inválido: ${item.dayOfWeek}`, StatusCodeHttp.BAD_REQUEST);
      }
      if (!VALID_STATUSES.includes(item.status)) {
        throw new AppError(`Status inválido para o dia ${item.dayOfWeek}: ${item.status}`, StatusCodeHttp.BAD_REQUEST);
      }
    }

    await studentWeeklyScheduleRepository.saveMany(studentId, items);
    return this.getSchedule(studentId);
  },

  /**
   * Obtém o status padrão programado do aluno para uma determinada data,
   * baseado no dia da semana.
   */
  async getDefaultStatusForDate(studentId: string, date: Date): Promise<DailyStatusValue> {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const record = await studentWeeklyScheduleRepository.findByStudentAndDay(studentId, dayOfWeek);
    return record?.status ?? "vai_normal";
  },
};
