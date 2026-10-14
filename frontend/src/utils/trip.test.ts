import { describe, it, expect } from "vitest";
import { filterStudentsForTrip, isStudentInTrip, parseTripType } from "./trip";

describe("isStudentInTrip", () => {
  const cases: [string | undefined | null, boolean, boolean][] = [
    // [status, participa da ida, participa da volta]
    ["vai_normal", true, true],
    ["so_ida", true, false],
    ["so_volta", false, true],
    ["nao_vai", false, false],
    [undefined, true, true], // sem status = padrão "vai_normal"
    [null, true, true],
    ["", true, true],
  ];

  it.each(cases)("status %s → ida=%s, volta=%s", (status, ida, volta) => {
    expect(isStudentInTrip(status, "ida")).toBe(ida);
    expect(isStudentInTrip(status, "volta")).toBe(volta);
  });

  it("status desconhecido não participa de nenhum trajeto", () => {
    expect(isStudentInTrip("qualquer_coisa", "ida")).toBe(false);
    expect(isStudentInTrip("qualquer_coisa", "volta")).toBe(false);
  });
});

describe("filterStudentsForTrip", () => {
  const students = [
    { id: "1", todayStatus: "vai_normal", classId: "A" },
    { id: "2", todayStatus: "so_ida", classId: "A" },
    { id: "3", todayStatus: "so_volta", classId: "B" },
    { id: "4", todayStatus: "nao_vai", classId: "B" },
    { id: "5", classId: "A" }, // sem status
    { id: "6", todayStatus: "vai_normal" }, // sem turma
  ];
  const ids = (list: { id: string }[]) => list.map((s) => s.id);

  it("ida sem turma: ignora o filtro de turma", () => {
    expect(ids(filterStudentsForTrip(students, "ida"))).toEqual(["1", "2", "5", "6"]);
    expect(ids(filterStudentsForTrip(students, "ida", null))).toEqual(["1", "2", "5", "6"]);
  });

  it("volta sem turma: ignora o filtro de turma", () => {
    expect(ids(filterStudentsForTrip(students, "volta"))).toEqual(["1", "3", "5", "6"]);
  });

  it("ida com turma: descarta outras turmas e mantém alunos sem turma", () => {
    expect(ids(filterStudentsForTrip(students, "ida", "A"))).toEqual(["1", "2", "5", "6"]);
    expect(ids(filterStudentsForTrip(students, "ida", "B"))).toEqual(["6"]);
  });

  it("volta com turma: descarta outras turmas e mantém alunos sem turma", () => {
    expect(ids(filterStudentsForTrip(students, "volta", "A"))).toEqual(["1", "5", "6"]);
    expect(ids(filterStudentsForTrip(students, "volta", "B"))).toEqual(["3", "6"]);
  });

  it("lista vazia retorna lista vazia", () => {
    expect(filterStudentsForTrip([], "ida", "A")).toEqual([]);
  });

  it("não altera a lista original", () => {
    const copy = [...students];
    filterStudentsForTrip(students, "ida", "A");
    expect(students).toEqual(copy);
  });
});

describe("parseTripType", () => {
  it("só 'volta' vira volta; todo o resto vira ida", () => {
    expect(parseTripType("volta")).toBe("volta");
    expect(parseTripType("ida")).toBe("ida");
    expect(parseTripType(null)).toBe("ida");
    expect(parseTripType(undefined)).toBe("ida");
    expect(parseTripType("xyz")).toBe("ida");
  });
});
