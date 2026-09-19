import { prisma } from "../lib/prisma";

export const driverRepository = {
  findByEmail(email: string) {
    return prisma.driver.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.driver.findUnique({ where: { id } });
  },

  create(data: { name: string; email: string; passwordHash: string; pixKey?: string }) {
    return prisma.driver.create({ data });
  },
};
