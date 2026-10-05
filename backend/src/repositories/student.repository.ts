import { prisma } from "../lib/prisma";

export const studentRepository = {
  findByEmail(email: string) {
    return prisma.student.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.student.findUnique({
      where: { id },
      include: { driver: { select: { id: true, name: true, photoUrl: true, phone: true } } },
    });
  },

  listActiveByDriver(driverId: string) {
    return prisma.student.findMany({
      where: { driverId, active: true },
      orderBy: { name: "asc" },
    });
  },

  listActiveAll() {
    return prisma.student.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  },

  listDisableAll() {
    return prisma.student.findMany({
      where: { active: false },
      orderBy: { name: "asc" },
    });
  },

  create(data: { driverId: string; name: string; email: string; passwordHash: string; phone?: string | null }) {
    return prisma.student.create({ data });
  },

  deactivate(id: string) {
    return prisma.student.update({ where: { id }, data: { active: false } });
  },

  reactivate(id: string) {
    return prisma.student.update({ where: { id }, data: { active: true } });
  },

  updatePhoto(id: string, photoUrl: string | null) {
    return prisma.student.update({ where: { id }, data: { photoUrl } });
  },

  updatePhone(id: string, phone: string | null) {
    return prisma.student.update({ where: { id }, data: { phone } });
  },
};
