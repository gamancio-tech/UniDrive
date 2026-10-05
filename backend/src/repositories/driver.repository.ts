import { prisma } from "../lib/prisma";

export const driverRepository = {
  
  findAll() {
    return prisma.driver.findMany();
  },
  
  findByEmail(email: string) {
    return prisma.driver.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.driver.findUnique({ where: { id } });
  },

  create(data: { name: string; email: string; passwordHash: string; pixKey?: string; phone?: string }) {
    return prisma.driver.create({ data: { ...data, phone: data.phone ?? "" } });
  },

  deactivate(id: string) {
    return prisma.driver.update({ where: { id }, data: { active: false } });
  },

  reactivate(id: string) {
    return prisma.driver.update({ where: { id }, data: { active: true } });
  },
};
