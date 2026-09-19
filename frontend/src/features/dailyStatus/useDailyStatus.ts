import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../api/client";

const POLL_INTERVAL_MS = 15_000; // RF02/RNF04: até ~15s de defasagem é aceitável para este caso de uso

export type DailyStatusValue = "vai_normal" | "so_ida" | "so_volta" | "nao_vai";

interface MissingCountResponse {
  cancelled: boolean;
  missingCount: number;
}

export function useDailyStatus() {
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMissingCount = useCallback(async () => {
    try {
      const data = await apiRequest<MissingCountResponse>("/daily-status/missing-count");
      setMissingCount(data.missingCount);
      setCancelled(data.cancelled);
    } catch (err) {
      console.error("Falha ao buscar contagem de faltantes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissingCount();
    const interval = setInterval(fetchMissingCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMissingCount]);

  const setStatus = useCallback(
    async (status: DailyStatusValue) => {
      await apiRequest("/daily-status", { method: "POST", body: { status } });
      await fetchMissingCount();
    },
    [fetchMissingCount],
  );

  const checkIn = useCallback(async () => {
    await apiRequest("/daily-status/checkin", { method: "POST" });
    await fetchMissingCount();
  }, [fetchMissingCount]);

  return { missingCount, cancelled, loading, setStatus, checkIn };
}
