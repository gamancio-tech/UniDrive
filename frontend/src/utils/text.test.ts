import { describe, it, expect } from "vitest";
import { firstName, getInitials } from "./text";

describe("getInitials", () => {
  it("nome vazio → ?", () => {
    expect(getInitials("")).toBe("?");
  });

  it("uma palavra → uma inicial", () => {
    expect(getInitials("maria")).toBe("M");
  });

  it("usa só as duas primeiras palavras", () => {
    expect(getInitials("maria souza lima")).toBe("MS");
  });
});

describe("firstName", () => {
  it("retorna a primeira palavra", () => {
    expect(firstName("Maria Souza")).toBe("Maria");
  });

  it("sem nome → vazio", () => {
    expect(firstName("")).toBe("");
    expect(firstName(null)).toBe("");
    expect(firstName(undefined)).toBe("");
  });
});
