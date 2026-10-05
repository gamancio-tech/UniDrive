import { prisma } from "../lib/prisma";

/** Campos seguros de motorista: nunca inclui passwordHash. */
export const driverSafeSelect = {
  id: true,
  name: true,
  email: true,
  pixKey: true,
  photoUrl: true,
  phone: true,
  active: true,
  createdAt: true,
} as const;

export const driverRepository = {
  
  findAll() {
    return prisma.driver.findMany({ select: driverSafeSelect });
  },
  
  /** Usado apenas no login (precisa do passwordHash para comparar). */
  findByEmail(email: string) {
    return prisma.driver.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.driver.findUnique({ where: { id }, select: driverSafeSelect });
  },

  create(data: { name: string; email: string; passwordHash: string; pixKey?: string; phone?: string }) {
    return prisma.driver.create({ data: { ...data, phone: data.phone ?? "" } });
  },

  deactivate(id: string) {
    return prisma.driver.update({ where: { id }, data: { active: false }, select: driverSafeSelect });
  },

  reactivate(id: string) {
    return prisma.driver.update({ where: { id }, data: { active: true }, select: driverSafeSelect });
  },
};
