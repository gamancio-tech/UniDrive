import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../api/client";

const POLL_INTERVAL_MS = 15_000; // RF02/RNF04: até ~15s de defasagem é aceitável para este caso de uso

export type DailyStatusValue = "vai_normal" | "so_ida" | "so_volta" | "nao_vai";
export type TripType = "ida" | "volta";
export type TripStep = "aguardando" | "em_viagem" | "finalizada";

interface MissingCountResponse {
  cancelled: boolean;
  missingCount: number;
  isBoarded?: boolean;
  currentStatus?: DailyStatusValue;
  trip?: TripType;
  tripStep?: TripStep;
}

export function useDailyStatus(trip?: "ida" | "volta", classId?: string) {
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBoarded, setIsBoarded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<DailyStatusValue>("vai_normal");
  const [currentTrip, setCurrentTrip] = useState<TripType>("ida");
  const [tripStep, setTripStep] = useState<TripStep>("aguardando");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMissingCount = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (trip) params.set("trip", trip);
      if (classId) params.set("classId", classId);
      const query = params.toString() ? `?${params.toString()}` : "";
      const url = `/daily-status/missing-count${query}`;

      const data = await apiRequest<MissingCountResponse>(url);
      setMissingCount(data.missingCount);
      setCancelled(data.cancelled);
      if (typeof data.isBoarded === "boolean") {
        setIsBoarded(data.isBoarded);
      }
      if (data.currentStatus) {
        setCurrentStatus(data.currentStatus);
      }
      if (data.trip) {
        setCurrentTrip(data.trip);
      }
      if (data.tripStep) {
        setTripStep(data.tripStep);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Falha ao buscar contagem de faltantes:", err);
    } finally {
      setLoading(false);
    }
  }, [trip, classId]);

  useEffect(() => {
    fetchMissingCount();
    const interval = setInterval(fetchMissingCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMissingCount]);

  const setStatus = useCallback(
    async (status: DailyStatusValue) => {
      setCurrentStatus(status);
      await apiRequest("/daily-status", { method: "POST", body: { status } });
      await fetchMissingCount();
    },
    [fetchMissingCount],
  );

  const checkIn = useCallback(async () => {
    setIsBoarded(true);
    await apiRequest("/daily-status/checkin", { method: "POST" });
    await fetchMissingCount();
  }, [fetchMissingCount]);

  const cancelBoardedSelf = useCallback(async () => {
    setIsBoarded(false);
    await apiRequest("/daily-status/cancel-boarded", { method: "POST" });
    await fetchMissingCount();
  }, [fetchMissingCount]);

  const cancelTrip = useCallback(
    async (reason = "Cancelado pelo motorista", customClassIds?: string[]) => {
      const targetClassIds =
        customClassIds && customClassIds.length > 0
          ? customClassIds
          : classId
          ? [classId]
          : [];

      setCancelled(true);
      await apiRequest("/trip-cancellations", {
        method: "POST",
        body: { reason, classIds: targetClassIds },
      });
      await fetchMissingCount();
    },
    [fetchMissingCount, classId],
  );

  const uncancelTrip = useCallback(
    async (customClassIds?: string[]) => {
      const targetClassIds =
        customClassIds && customClassIds.length > 0
          ? customClassIds
          : classId
          ? [classId]
          : [];

      setCancelled(false);
      await apiRequest("/trip-cancellations", {
        method: "DELETE",
        body: { classIds: targetClassIds },
      });
      await fetchMissingCount();
    },
    [fetchMissingCount, classId],
  );

  const updateTripState = useCallback(
    async (newTrip: TripType, newStep: TripStep) => {
      setCurrentTrip(newTrip);
      setTripStep(newStep);
      await apiRequest("/daily-status/trip-state", {
        method: "POST",
        body: { trip: newTrip, step: newStep, classId },
      });
      await fetchMissingCount();
    },
    [fetchMissingCount, classId],
  );

  return {
    missingCount,
    cancelled,
    loading,
    isBoarded,
    currentStatus,
    currentTrip,
    tripStep,
    lastUpdated,
    setStatus,
    checkIn,
    cancelBoardedSelf,
    cancelTrip,
    uncancelTrip,
    updateTripState,
    refresh: fetchMissingCount,
  };
}
