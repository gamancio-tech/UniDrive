import { describe, it, expect } from "vitest";
import { formatPhoneInput, getPhoneDigits, toTelHref } from "./phone";

describe("formatPhoneInput", () => {
  it("0 dígitos → vazio", () => {
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("abc")).toBe("");
  });

  it("1 e 2 dígitos → abre parêntese", () => {
    expect(formatPhoneInput("1")).toBe("(1");
    expect(formatPhoneInput("11")).toBe("(11");
  });

  it("3 a 6 dígitos → (DD) resto", () => {
    expect(formatPhoneInput("119")).toBe("(11) 9");
    expect(formatPhoneInput("119999")).toBe("(11) 9999");
  });

  it("7 a 10 dígitos → (DD) XXXX-XXXX", () => {
    expect(formatPhoneInput("1199999")).toBe("(11) 9999-9");
    expect(formatPhoneInput("1133334444")).toBe("(11) 3333-4444");
  });

  it("11 dígitos → (DD) XXXXX-XXXX", () => {
    expect(formatPhoneInput("11999998888")).toBe("(11) 99999-8888");
  });

  it("mais de 11 dígitos → corta no 11º", () => {
    expect(formatPhoneInput("119999988887777")).toBe("(11) 99999-8888");
  });

  it("aceita valor já formatado (idempotente)", () => {
    expect(formatPhoneInput("(11) 99999-8888")).toBe("(11) 99999-8888");
  });
});

describe("getPhoneDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(getPhoneDigits("(11) 99999-8888")).toBe("11999998888");
  });
});

describe("toTelHref", () => {
  it("monta tel: apenas com dígitos", () => {
    expect(toTelHref("(11) 99999-8888")).toBe("tel:11999998888");
  });

  it("preserva o + do código do país", () => {
    expect(toTelHref("+55 (11) 99999-8888")).toBe("tel:+5511999998888");
  });
});
