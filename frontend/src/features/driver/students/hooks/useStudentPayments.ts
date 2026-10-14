import { useState, useEffect, useCallback } from "react";
import {
  PaymentCycle,
  getStudentPaymentStatus,
  markStudentPaidByDriver,
  rejectStudentPaymentByDriver,
} from "../../../../api/payments";
import { RegisteredStudent } from "../../../../api/students";
import { useToast } from "../../../../components/Toast";
import { UseRowActionReturn, useRowAction } from "./useRowAction";

const POLL_INTERVAL_MS = 15_000;

export interface UseStudentPaymentsReturn {
  paymentStatuses: Record<string, PaymentCycle>;
  markingPaidId: string | null;
  rejectingPaymentId: string | null;
  handleConfirmPayment: (studentId: string) => Promise<void>;
  handleRejectPayment: (studentId: string) => Promise<void>;
}

export function useStudentPayments(
  students: RegisteredStudent[],
  externalRowAction?: UseRowActionReturn
): UseStudentPaymentsReturn {
  const { showToast } = useToast();
  const internalRowAction = useRowAction();
  const rowAction = externalRowAction ?? internalRowAction;
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentCycle>>({});

  const markingPaidId = rowAction.activeAction === "markPaid" ? rowAction.activeId : null;
  const rejectingPaymentId = rowAction.activeAction === "rejectPayment" ? rowAction.activeId : null;

  const loadPayments = useCallback(async () => {
    if (!students.length) {
      setPaymentStatuses({});
      return;
    }
    try {
      const paymentEntries = await Promise.allSettled(
        students.map(async (s) => {
          const status = await getStudentPaymentStatus(s.id);
          return { id: s.id, status };
        })
      );
      const paymentMap: Record<string, PaymentCycle> = {};
      paymentEntries.forEach((entry) => {
        if (entry.status === "fulfilled") {
          paymentMap[entry.value.id] = entry.value.status;
        }
      });
      setPaymentStatuses(paymentMap);
    } catch (err: unknown) {
      console.error("Erro ao carregar pagamentos dos alunos:", err);
    }
  }, [students]);

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadPayments]);

  const handleConfirmPayment = useCallback(
    async (studentId: string) => {
      await rowAction.run(studentId, "markPaid", async () => {
        try {
          const updated = await markStudentPaidByDriver(studentId);
          setPaymentStatuses((prev) => ({ ...prev, [studentId]: updated }));
          showToast("Pagamento confirmado com sucesso!", "success");
        } catch (err: unknown) {
          showToast(err instanceof Error ? err.message : "Erro ao confirmar pagamento.", "error");
        }
      });
    },
    [rowAction, showToast]
  );

  const handleRejectPayment = useCallback(
    async (studentId: string) => {
      await rowAction.run(studentId, "rejectPayment", async () => {
        try {
          const updated = await rejectStudentPaymentByDriver(studentId);
          setPaymentStatuses((prev) => ({ ...prev, [studentId]: updated }));
          showToast("Solicitação de pagamento recusada.", "info");
        } catch (err: unknown) {
          showToast(err instanceof Error ? err.message : "Erro ao recusar pagamento.", "error");
        }
      });
    },
    [rowAction, showToast]
  );

  return {
    paymentStatuses,
    markingPaidId,
    rejectingPaymentId,
    handleConfirmPayment,
    handleRejectPayment,
  };
}
