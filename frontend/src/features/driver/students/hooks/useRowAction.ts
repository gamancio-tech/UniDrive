import { useState, useCallback } from "react";

export type RowActionType =
  | "checkIn"
  | "markPaid"
  | "rejectPayment"
  | "reactivate"
  | string;

export interface UseRowActionReturn {
  activeId: string | null;
  activeAction: RowActionType | null;
  isBusy: (id: string, action?: RowActionType) => boolean;
  run: <T>(id: string, action: RowActionType, fn: () => Promise<T>) => Promise<T | undefined>;
}

export function useRowAction(): UseRowActionReturn {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<RowActionType | null>(null);

  const isBusy = useCallback(
    (id: string, action?: RowActionType) => {
      if (activeId !== id) return false;
      if (action !== undefined) return activeAction === action;
      return true;
    },
    [activeId, activeAction]
  );

  const run = useCallback(
    async <T>(id: string, action: RowActionType, fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        setActiveId(id);
        setActiveAction(action);
        return await fn();
      } finally {
        setActiveId(null);
        setActiveAction(null);
      }
    },
    []
  );

  return {
    activeId,
    activeAction,
    isBusy,
    run,
  };
}
