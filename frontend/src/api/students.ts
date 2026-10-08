import { apiRequest } from "./client";

export interface DriverStudent {
  id: string;
  name: string;
  email: string;
  classId?: string;
  className?: string;
  active?: boolean;
  todayStatus?: "vai_normal" | "so_ida" | "so_volta" | "nao_vai" | string;
  isBoarded?: boolean;
  photoUrl?: string | null;
  phone?: string | null;
}

export interface CreateStudentPayload {
  name: string;
  email: string;
  temporaryPassword: string;
  phone?: string | null;
  classId: string;
}

export interface CreatedStudentResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  classId?: string;
}

export interface RegisteredStudent {
  id: string;
  name: string;
  email: string;
  classId?: string;
  class?: { id: string; name: string };
  active: boolean;
  photoUrl?: string | null;
  phone?: string | null;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  classId?: string;
  className?: string;
  photoUrl?: string | null;
  phone?: string | null;
  driverId: string;
  driverName?: string;
  driverPhotoUrl?: string | null;
  driverPhone?: string | null;
}

/**
 * Lista os alunos vinculados ao motorista autenticado com seus status do dia (opcionalmente filtrado por turma).
 */
export async function getDriverStudents(classId?: string): Promise<DriverStudent[]> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  return apiRequest<DriverStudent[]>(`/students${query}`);
}

/**
 * Lista os alunos cadastrados no sistema filtrando por status ativo ou inativo.
 * Não contém status diário de viagem (RF09).
 */
export async function getStudentsByStatus(active: boolean, classId?: string): Promise<RegisteredStudent[]> {
  const query = classId
    ? `?status=${active}&classId=${encodeURIComponent(classId)}`
    : `?status=${active}`;
  return apiRequest<RegisteredStudent[]>(`/students${query}`);
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
 * Reseta o status de embarque de todos os alunos do motorista no dia (ao finalizar trajeto, opcionalmente filtrado por turma).
 */
export async function resetAllDailyBoarded(classId?: string): Promise<{ message: string }> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  return apiRequest<{ message: string }>(`/daily-status/reset-all${query}`, {
    method: "POST",
    body: classId ? { classId } : undefined,
  });
}

/**
 * Busca os dados do perfil do aluno autenticado.
 */
export async function getStudentProfile(): Promise<StudentProfile> {
  return apiRequest<StudentProfile>("/students/me/profile");
}

/**
 * Atualiza ou remove a foto de perfil do aluno autenticado.
 */
export async function updateStudentProfilePhoto(
  photoUrl: string | null
): Promise<{ message: string; student: { id: string; name: string; photoUrl: string | null } }> {
  return apiRequest<{ message: string; student: { id: string; name: string; photoUrl: string | null } }>(
    "/students/me/photo",
    {
      method: "PATCH",
      body: { photoUrl },
    }
  );
}

/**
 * Atualiza o telefone do aluno (chamado pelo próprio aluno ou pelo motorista).
 */
export async function updateStudentPhone(
  studentId: string,
  phone: string
): Promise<{ message: string; student: { id: string; name: string; phone: string } }> {
  return apiRequest<{ message: string; student: { id: string; name: string; phone: string } }>(
    `/students/${studentId}/phone`,
    {
      method: "PATCH",
      body: { phone },
    }
  );
}

