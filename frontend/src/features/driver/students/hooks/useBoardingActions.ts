import React from "react";
import { apiRequest } from "../../../../api/client";
import { DriverStudent } from "../../../../api/students";
import { useToast } from "../../../../components/Toast";
import { UseRowActionReturn } from "./useRowAction";

export interface UseBoardingActionsParams {
  setDailyStudents: React.Dispatch<React.SetStateAction<DriverStudent[]>>;
  rowAction: UseRowActionReturn;
}

export function useBoardingActions({ setDailyStudents, rowAction }: UseBoardingActionsParams) {
  const { showToast } = useToast();

  const handleManualCheckIn = async (studentId: string) => {
    await rowAction.run(studentId, "checkIn", async () => {
      try {
        await apiRequest(`/daily-status/checkin/${studentId}`, {
          method: "POST",
        });
        setDailyStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, isBoarded: true } : s))
        );
        showToast("Embarque registrado!", "success");
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Erro ao confirmar embarque.", "error");
      }
    });
  };

  const handleUndoCheckIn = async (studentId: string) => {
    await rowAction.run(studentId, "checkIn", async () => {
      try {
        await apiRequest(`/daily-status/cancel-boarded/${studentId}`, {
          method: "POST",
        });
        setDailyStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, isBoarded: false } : s))
        );
        showToast("Embarque desfeito.", "info");
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Erro ao desfazer embarque.", "error");
      }
    });
  };

  return {
    handleManualCheckIn,
    handleUndoCheckIn,
  };
}
