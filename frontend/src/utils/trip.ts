// Regras puras do trajeto (Ida/Volta). Sem React, sem API, sem localStorage.
// Fonte única da regra "quem participa de cada trajeto" (RF01/RF04).

export type TripType = "ida" | "volta";

/** Converte um valor salvo (ex.: do localStorage) em TripType; qualquer outro valor vira "ida". */
export function parseTripType(value: string | null | undefined): TripType {
  return value === "volta" ? "volta" : "ida";
}

/**
 * Regra de negócio: o aluno participa do trajeto se estiver como "vai_normal"
 * (padrão quando não há status) ou se o status for específico do trajeto
 * ("so_ida" na Ida, "so_volta" na Volta). "nao_vai" nunca participa.
 */
export function isStudentInTrip(status: string | null | undefined, tripType: TripType): boolean {
  const effectiveStatus = status || "vai_normal";
  if (tripType === "ida") {
    return effectiveStatus === "vai_normal" || effectiveStatus === "so_ida";
  }
  return effectiveStatus === "vai_normal" || effectiveStatus === "so_volta";
}

interface TripStudentLike {
  todayStatus?: string | null;
  classId?: string | null;
}

/**
 * Filtra os alunos que participam do trajeto informado.
 * Se `classId` for informado, descarta alunos de OUTRA turma (alunos sem turma são mantidos).
 */
export function filterStudentsForTrip<T extends TripStudentLike>(
  students: T[],
  tripType: TripType,
  classId?: string | null
): T[] {
  return students
    .filter((s) => !classId || !s.classId || s.classId === classId)
    .filter((s) => isStudentInTrip(s.todayStatus, tripType));
}
