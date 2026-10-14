import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatMessageDate, formatMessageTime } from "./date";

describe("formatMessageDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 15/06/2025 12:00 (horário local)
    vi.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mesmo dia → Hoje", () => {
    expect(formatMessageDate(new Date(2025, 5, 15, 8, 30).toISOString())).toBe("Hoje");
  });

  it("dia anterior → Ontem", () => {
    expect(formatMessageDate(new Date(2025, 5, 14, 23, 59).toISOString())).toBe("Ontem");
  });

  it("virada de mês: ontem de 01/07 é 30/06", () => {
    vi.setSystemTime(new Date(2025, 6, 1, 12, 0, 0));
    expect(formatMessageDate(new Date(2025, 5, 30, 10, 0).toISOString())).toBe("Ontem");
  });

  it("outra data → dd/mm", () => {
    expect(formatMessageDate(new Date(2025, 5, 3, 10, 0).toISOString())).toBe("03/06");
    expect(formatMessageDate(new Date(2025, 11, 25, 10, 0).toISOString())).toBe("25/12");
  });
});

describe("formatMessageTime", () => {
  it("retorna hora e minuto com 2 dígitos", () => {
    const result = formatMessageTime(new Date(2025, 5, 15, 9, 5).toISOString());
    expect(result).toMatch(/09.05/);
  });
});
