import { apiRequest } from "./client";

export interface DriverStudent {
  id: string;
  name: string;
  email: string;
  active?: boolean;
  todayStatus?: "vai_normal" | "so_ida" | "so_volta" | "nao_vai" | string;
  isBoarded?: boolean;
}

export interface CreateStudentPayload {
  name: string;
  email: string;
  temporaryPassword: string;
}

export interface CreatedStudentResponse {
  id: string;
  name: string;
  email: string;
}

export interface RegisteredStudent {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

/**
 * Lista os alunos vinculados ao motorista autenticado com seus status do dia.
 */
export async function getDriverStudents(): Promise<DriverStudent[]> {
  return apiRequest<DriverStudent[]>("/students");
}

/**
 * Lista os alunos cadastrados no sistema filtrando por status ativo ou inativo.
 * Não contém status diário de viagem (RF09).
 */
export async function getStudentsByStatus(active: boolean): Promise<RegisteredStudent[]> {
  return apiRequest<RegisteredStudent[]>(`/students?status=${active}`);
}

/**
 * Cadastra um novo aluno na van do motorista autenticado.
 */
export async function createDriverStudent(payload: CreateStudentPayload): Promise<CreatedStudentResponse> {
  return apiRequest<CreatedStudentResponse>("/students", {
    method: "POST",
    body: payload,
  });
}

/**
 * Desativa um aluno da van do motorista.
 */
export async function deactivateDriverStudent(studentId: string): Promise<void> {
  return apiRequest<void>(`/students/${studentId}`, {
    method: "DELETE",
  });
}

/**
 * Reativa um aluno da van do motorista.
 */
export async function reactivateDriverStudent(studentId: string): Promise<void> {
  return apiRequest<void>(`/students/${studentId}/reactivate`, {
    method: "PATCH",
  });
}

/**
 * Reseta o status de embarque de todos os alunos do motorista no dia (ao finalizar trajeto).
 */
export async function resetAllDailyBoarded(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/daily-status/reset-all", {
    method: "POST",
  });
}

