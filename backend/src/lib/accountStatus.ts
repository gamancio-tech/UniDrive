import { prisma } from "./prisma";
import { AuthenticatedRole } from "../types/express";

/**
 * Verifica se a conta do token ainda existe e está ativa (V06).
 * O JWT é assinado e dura dias; sem essa checagem, um aluno/motorista desativado
 * (ou um admin removido) continuaria acessando a API até o token expirar.
 *
 * Usa cache em memória de curta duração para não consultar o banco em todo
 * request de polling. Ao desativar uma conta, chame invalidateAccountCache(id).
 */
const TTL_MS = 30_000;
const cache = new Map<string, { active: boolean; expiresAt: number }>();

export function invalidateAccountCache(id: string) {
  for (const role of ["driver", "student", "admin"] as AuthenticatedRole[]) {
    cache.delete(`${role}:${id}`);
  }
}

async function queryActive(role: AuthenticatedRole, id: string): Promise<boolean> {
  if (role === "student") {
    const s = await prisma.student.findUnique({ where: { id }, select: { active: true } });
    return Boolean(s?.active);
  }
  if (role === "driver") {
    const d = await prisma.driver.findUnique({ where: { id }, select: { active: true } });
    return Boolean(d?.active);
  }
  const a = await prisma.admin.findUnique({ where: { id }, select: { id: true } });
  return Boolean(a);
}

export async function isAccountActive(role: AuthenticatedRole, id: string): Promise<boolean> {
  const key = `${role}:${id}`;
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) return hit.active;

  const active = await queryActive(role, id);
  cache.set(key, { active, expiresAt: now + TTL_MS });
  return active;
}
