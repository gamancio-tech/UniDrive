import { apiRequest } from "./client";

export type MarkedBy = "student" | "driver";

export interface PaymentCycle {
  id: string;
  studentId: string;
  referenceMonth: string;
  reminderDaysBefore: number;
  paidAt: string | null;
  markedBy: MarkedBy | null;
}

/**
 * Obtém ou cria o ciclo de pagamento do mês atual do estudante autenticado.
 */
export async function getMyCurrentCycle(): Promise<PaymentCycle> {
  return apiRequest<PaymentCycle>("/payments/me");
}

/**
 * Obtém todo o histórico de ciclos de pagamento do estudante autenticado.
 */
export async function getMyPaymentHistory(): Promise<PaymentCycle[]> {
  return apiRequest<PaymentCycle[]>("/payments/me/history");
}

/**
 * Marca o ciclo de pagamento do mês atual do aluno autenticado como pago (pelo aluno).
 */
export async function payMyCycle(): Promise<PaymentCycle> {
  return apiRequest<PaymentCycle>("/payments/me/pay", {
    method: "POST",
  });
}

/**
 * Atualiza os dias de antecedência para disparo de lembrete de vencimento.
 */
export async function updateReminderDays(days: number): Promise<PaymentCycle> {
  return apiRequest<PaymentCycle>("/payments/me/reminder", {
    method: "PATCH",
    body: { days },
  });
}

/**
 * Motorista consulta o ciclo do mês atual de um aluno específico.
 */
export async function getStudentPaymentStatus(studentId: string): Promise<PaymentCycle> {
  return apiRequest<PaymentCycle>(`/payments/student/${studentId}`);
}

/**
 * Motorista confirma/baixa manualmente o pagamento do mês atual de um aluno específico.
 */
export async function markStudentPaidByDriver(studentId: string): Promise<PaymentCycle> {
  return apiRequest<PaymentCycle>(`/payments/${studentId}/pay`, {
    method: "POST",
  });
}
