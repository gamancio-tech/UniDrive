import { MarkedBy } from "@prisma/client";
import { paymentRepository } from "../repositories/payment.repository";
import { studentRepository } from "../repositories/student.repository";
import { pushService } from "./push.service";
import { env } from "../config/env";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

const DEFAULT_REMINDER_DAYS_BEFORE = env.reminderDaysBeforePayment;

function firstDayOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export const paymentService = {
  /** RF07: garante que existe um ciclo de pagamento para o mês atual do aluno. */
  async getOrCreateCurrentCycle(studentId: string) {
    return paymentRepository.findOrCreateCycle(studentId, firstDayOfCurrentMonth(), DEFAULT_REMINDER_DAYS_BEFORE);
  },

  /** 
   * Nova Regra de Negócio: O aluno não marca diretamente como pago.
   * Ele apenas informa que realizou o pagamento (solicita confirmação).
   * O motorista recebe notificação e precisará confirmar para que conste como pago.
   */
  async requestCurrentCyclePayment(studentId: string) {
    const current = await this.getOrCreateCurrentCycle(studentId);
    if (current.paidAt) {
      return current;
    }

    const updated = await paymentRepository.requestPayment(studentId, firstDayOfCurrentMonth());

    // Notifica o motorista da van
    const student = await studentRepository.findById(studentId);
    if (student?.driverId) {
      pushService.notifyDriver(student.driverId, {
        title: "Pagamento informado",
        body: `${student.name} informou que realizou o pagamento da van. Confirme no app.`,
      }).catch((err) => console.error("Erro ao notificar motorista sobre pagamento:", err));
    }

    return updated;
  },

  /** 
   * Confirmação manual de pagamento realizada pelo motorista.
   * Somente aqui o ciclo recebe paidAt e o aluno é notificado da confirmação.
   */
  async confirmPaymentByDriver(studentId: string, driverId: string) {
    const student = await studentRepository.findById(studentId);
    if (!student || student.driverId !== driverId) {
      throw new AppError("Aluno não encontrado ou não pertence a esta van.", StatusCodeHttp.NOT_FOUND);
    }

    await this.getOrCreateCurrentCycle(studentId);
    const updated = await paymentRepository.markPaid(studentId, firstDayOfCurrentMonth(), "driver");

    // Notifica o aluno que o motorista confirmou o pagamento
    pushService.notifyStudents([studentId], {
      title: "Pagamento confirmado! 🚐✅",
      body: "O motorista confirmou o recebimento da sua mensalidade.",
    }).catch((err) => console.error("Erro ao notificar aluno sobre confirmação de pagamento:", err));

    return updated;
  },

  /** 
   * Rejeição pelo motorista caso o pagamento não tenha sido identificado.
   * Reseta o status de solicitação e avisa o aluno.
   */
  async rejectPaymentByDriver(studentId: string, driverId: string) {
    const student = await studentRepository.findById(studentId);
    if (!student || student.driverId !== driverId) {
      throw new AppError("Aluno não encontrado ou não pertence a esta van.", StatusCodeHttp.NOT_FOUND);
    }

    await this.getOrCreateCurrentCycle(studentId);
    const updated = await paymentRepository.rejectPayment(studentId, firstDayOfCurrentMonth());

    // Notifica o aluno sobre a não identificação
    pushService.notifyStudents([studentId], {
      title: "Pagamento não confirmado",
      body: "O motorista não identificou o seu pagamento da van. Entre em contato se necessário.",
    }).catch((err) => console.error("Erro ao notificar aluno sobre pagamento rejeitado:", err));

    return updated;
  },

  /** RF08: marca o ciclo do mês atual como pago, interrompendo os lembretes (retrocompatibilidade). */
  async markCurrentCyclePaid(studentId: string, markedBy: MarkedBy) {
    await this.getOrCreateCurrentCycle(studentId);
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
   * RF07: verifica pendências e envia lembretes.
   */
  async sendDueRemindersForDriver(driverId: string) {
    const students = await studentRepository.listActiveByDriver(driverId);
    const today = new Date();

    for (const student of students) {
      const cycle = await this.getOrCreateCurrentCycle(student.id);
      // Se já está pago ou se o aluno já avisou que pagou (aguardando confirmação), não cobra
      if (cycle.paidAt || cycle.paymentRequestedAt) continue;

      const dueDate = new Date(cycle.referenceMonth);
      dueDate.setUTCDate(dueDate.getUTCDate() + 1);
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
