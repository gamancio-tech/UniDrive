import { apiRequest } from "./client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isSuperAdmin?: boolean;
  createdAt?: string;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
}

export interface DriverAdmin {
  id: string;
  name: string;
  email: string;
  pixKey?: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateDriverPayload {
  name: string;
  email: string;
  password: string;
  pixKey?: string;
}

export interface StudentAdmin {
  id: string;
  name: string;
  email: string;
  active: boolean;
  driverId: string;
  createdAt?: string;
}

export interface CreateStudentAdminPayload {
  name: string;
  email: string;
  password: string;
  driverId: string;
}

/**
 * Cria um novo administrador do sistema.
 */
export async function createAdmin(payload: CreateAdminPayload): Promise<AdminUser> {
  return apiRequest<AdminUser>("/admin/admin", {
    method: "POST",
    body: payload,
  });
}

/**
 * Lista todos os administradores cadastrados (apenas Super Admin).
 */
export async function getAdmins(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/admin/list/admins");
}

/**
 * Remove um perfil de administrador (apenas Super Admin).
 */
export async function deleteAdmin(id: string): Promise<{ message: string; admin: AdminUser }> {
  return apiRequest<{ message: string; admin: AdminUser }>(`/admin/admin/${id}`, {
    method: "DELETE",
  });
}

/**
 * Lista todos os motoristas cadastrados.
 */
export async function getDrivers(): Promise<DriverAdmin[]> {
  return apiRequest<DriverAdmin[]>("/admin/list/drivers");
}

/**
 * Busca detalhes de um motorista específico pelo ID.
 */
export async function getDriverById(id: string): Promise<DriverAdmin> {
  return apiRequest<DriverAdmin>(`/admin/list/drivers/${id}`);
}

/**
 * Cadastra um novo motorista com chave Pix opcional.
 */
export async function createDriver(payload: CreateDriverPayload): Promise<AdminUser> {
  return apiRequest<AdminUser>("/admin/driver", {
    method: "POST",
    body: payload,
  });
}

/**
 * Desativa o acesso de um motorista no sistema.
 */
export async function deactivateAdminDriver(id: string): Promise<DriverAdmin> {
  return apiRequest<DriverAdmin>(`/admin/driver/${id}`, {
    method: "DELETE",
  });
}

/**
 * Reativa o cadastro de um motorista desativado.
 */
export async function reactivateAdminDriver(id: string): Promise<DriverAdmin> {
  return apiRequest<DriverAdmin>(`/admin/driver/reactivate/${id}`, {
    method: "PATCH",
  });
}

/**
 * Lista estudantes filtrando por status (ativos ou inativos).
 */
export async function getStudentsByStatus(status: "true" | "false"): Promise<StudentAdmin[]> {
  return apiRequest<StudentAdmin[]>(`/admin/list/students?status=${status}`);
}

/**
 * Busca detalhes de um estudante específico pelo ID.
 */
export async function getStudentById(id: string): Promise<StudentAdmin> {
  return apiRequest<StudentAdmin>(`/admin/list/students/${id}`);
}

/**
 * Cadastra um novo estudante associado a um motorista.
 */
export async function createStudentByAdmin(payload: CreateStudentAdminPayload): Promise<StudentAdmin> {
  return apiRequest<StudentAdmin>("/admin/student", {
    method: "POST",
    body: payload,
  });
}

/**
 * Desativa o acesso de um estudante no sistema.
 */
export async function deactivateAdminStudent(id: string): Promise<StudentAdmin> {
  return apiRequest<StudentAdmin>(`/admin/student/${id}`, {
    method: "DELETE",
  });
}

/**
 * Reativa o cadastro de um estudante desativado.
 */
export async function reactivateAdminStudent(id: string): Promise<StudentAdmin> {
  return apiRequest<StudentAdmin>(`/admin/student/reactivate/${id}`, {
    method: "PATCH",
  });
}
