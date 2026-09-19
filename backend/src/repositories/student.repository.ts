import { prisma } from "../lib/prisma";

export const studentRepository = {
  findByEmail(email: string) {
    return prisma.student.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.student.findUnique({ where: { id } });
  },

  listActiveByDriver(driverId: string) {
    return prisma.student.findMany({
      where: { driverId, active: true },
      orderBy: { name: "asc" },
    });
  },

  create(data: { driverId: string; name: string; email: string; passwordHash: string }) {
    return prisma.student.create({ data });
  },

  deactivate(id: string) {
    return prisma.student.update({ where: { id }, data: { active: false } });
  },
};
