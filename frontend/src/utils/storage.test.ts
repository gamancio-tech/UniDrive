import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { STORAGE_KEYS, getStorage, removeStorage, setStorage } from "./storage";

function createFakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createFakeStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("grava, lê e remove usando as chaves centralizadas", () => {
    expect(getStorage(STORAGE_KEYS.driverTripType)).toBeNull();
    setStorage(STORAGE_KEYS.driverTripType, "volta");
    expect(getStorage(STORAGE_KEYS.driverTripType)).toBe("volta");
    removeStorage(STORAGE_KEYS.driverTripType);
    expect(getStorage(STORAGE_KEYS.driverTripType)).toBeNull();
  });

  it("mantém os nomes de chave originais (não perder preferência salva)", () => {
    expect(STORAGE_KEYS).toEqual({
      driverTripType: "unidrive_driver_trip_type",
      activeClassId: "unidrive_active_class_id",
      activeClassName: "unidrive_active_class_name",
    });
  });

  it("não lança erro quando o storage está indisponível", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
      removeItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(getStorage(STORAGE_KEYS.activeClassId)).toBeNull();
    expect(() => setStorage(STORAGE_KEYS.activeClassId, "x")).not.toThrow();
    expect(() => removeStorage(STORAGE_KEYS.activeClassId)).not.toThrow();
  });
});
