import { useState, useCallback } from "react";
import { apiRequest } from "../../../../api/client";
import { resetAllDailyBoarded, DriverStudent } from "../../../../api/students";
import { TripStep } from "../../../dailyStatus/useDailyStatus";
import { TripType } from "../../../../utils/trip";
import { useToast } from "../../../../components/Toast";

export interface UseTripActionsParams {
  tripType: TripType;
  activeClassId?: string;
  onUpdateTripState?: (trip: TripType, step: TripStep) => Promise<void>;
  onSelectTrip: (trip: TripType) => void;
  onTripFinished?: () => void;
  setDailyStudents: React.Dispatch<React.SetStateAction<DriverStudent[]>>;
  onSuccessFinish?: (nextTrip: TripType) => void;
}

export interface UseTripActionsReturn {
  finishingTrip: boolean;
  handleConfirmFinishTrip: () => Promise<void>;
  handleDeclareDeparture: () => Promise<void>;
}

export function useTripActions({
  tripType,
  activeClassId,
  onUpdateTripState,
  onSelectTrip,
  onTripFinished,
  setDailyStudents,
  onSuccessFinish,
}: UseTripActionsParams): UseTripActionsReturn {
  const { showToast } = useToast();
  const [finishingTrip, setFinishingTrip] = useState(false);

  const handleConfirmFinishTrip = useCallback(async () => {
    try {
      setFinishingTrip(true);
      await resetAllDailyBoarded(activeClassId);

      // Alterna o trajeto entre Ida e Volta
      const nextTrip: TripType = tripType === "ida" ? "volta" : "ida";

      // Sincroniza o estado da viagem com o backend
      if (onUpdateTripState) {
        await onUpdateTripState(nextTrip, "aguardando");
      } else {
        await apiRequest("/daily-status/trip-state", {
          method: "POST",
          body: { trip: nextTrip, step: "aguardando", classId: activeClassId || undefined },
        });
      }

      // Zera localmente o embarque de todos os alunos do trajeto diário
      setDailyStudents((prev) => prev.map((s) => ({ ...s, isBoarded: false })));

      onSelectTrip(nextTrip);
      onSuccessFinish?.(nextTrip);
      onTripFinished?.();

      showToast(
        `Viagem de ${tripType === "ida" ? "Ida" : "Volta"} finalizada! Lista de ${nextTrip === "ida" ? "Ida" : "Volta"} iniciada.`,
        "success"
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao finalizar viagem.", "error");
    } finally {
      setFinishingTrip(false);
    }
  }, [
    activeClassId,
    tripType,
    onUpdateTripState,
    setDailyStudents,
    onSelectTrip,
    onSuccessFinish,
    onTripFinished,
    showToast,
  ]);

  const handleDeclareDeparture = useCallback(async () => {
    try {
      setFinishingTrip(true);
      if (onUpdateTripState) {
        await onUpdateTripState("volta", "em_viagem");
      } else {
        await apiRequest("/daily-status/trip-state", {
          method: "POST",
          body: { trip: "volta", step: "em_viagem", classId: activeClassId || undefined },
        });
      }
      onTripFinished?.();
      showToast("Viagem de volta iniciada! A contagem de faltantes foi encerrada para os alunos.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao declarar partida.", "error");
    } finally {
      setFinishingTrip(false);
    }
  }, [activeClassId, onUpdateTripState, onTripFinished, showToast]);

  return {
    finishingTrip,
    handleConfirmFinishTrip,
    handleDeclareDeparture,
  };
}
