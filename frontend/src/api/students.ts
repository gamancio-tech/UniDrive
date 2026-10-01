import { apiRequest } from "./client";

export interface DriverStudent {
  id: string;
  name: string;
  email: string;
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

/**
 * Lista os alunos vinculados ao motorista autenticado com seus status do dia.
 */
export async function getDriverStudents(): Promise<DriverStudent[]> {
  return apiRequest<DriverStudent[]>("/students");
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
