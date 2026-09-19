import { MarkedBy } from "@prisma/client";
import { paymentRepository } from "../repositories/payment.repository";
import { studentRepository } from "../repositories/student.repository";
import { pushService } from "./push.service";

const DEFAULT_REMINDER_DAYS_BEFORE = 3;

function firstDayOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export const paymentService = {
  /** RF07: garante que existe um ciclo de pagamento para o mês atual do aluno. */
  async getOrCreateCurrentCycle(studentId: string) {
    return paymentRepository.findOrCreateCycle(studentId, firstDayOfCurrentMonth(), DEFAULT_REMINDER_DAYS_BEFORE);
  },

  /** RF08: marca o ciclo do mês atual como pago, interrompendo os lembretes. */
  async markCurrentCyclePaid(studentId: string, markedBy: MarkedBy) {
    await this.getOrCreateCurrentCycle(studentId); // garante que o ciclo existe antes de marcar
    return paymentRepository.markPaid(studentId, firstDayOfCurrentMonth(), markedBy);
  },

  async updateReminderDays(studentId: string, days: number) {
    await this.getOrCreateCurrentCycle(studentId);
    return paymentRepository.updateReminderDays(studentId, firstDayOfCurrentMonth(), days);
  },

  history(studentId: string) {
    return paymentRepository.listByStudent(studentId);
  },

  /**
   * RF07: verifica pendências e envia lembretes. Pensado para ser chamado uma vez por dia
   * por um agendador (ex.: node-cron ou um cron job externo) — ainda não incluído neste scaffold.
   */
  async sendDueRemindersForDriver(driverId: string) {
    const students = await studentRepository.listActiveByDriver(driverId);
    const today = new Date();

    for (const student of students) {
      const cycle = await this.getOrCreateCurrentCycle(student.id);
      if (cycle.paidAt) continue;

      const dueDate = new Date(cycle.referenceMonth);
      dueDate.setUTCDate(dueDate.getUTCDate() + 1); // simplificação: vencimento no dia 1 do mês seguinte fica para refinar
      const reminderDate = new Date(dueDate);
      reminderDate.setUTCDate(reminderDate.getUTCDate() - cycle.reminderDaysBefore);

      const isReminderDay = today.toDateString() === reminderDate.toDateString();
      const isDueDay = today.toDateString() === dueDate.toDateString();

      if (isReminderDay || isDueDay) {
        await pushService.notifyStudents([student.id], {
          title: "Lembrete de pagamento da van",
          body: isDueDay ? "O pagamento da van vence hoje." : "O pagamento da van vence em breve.",
        });
      }
    }
  },
};
