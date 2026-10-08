import { prisma } from "../lib/prisma";

export const classRepository = {
  create(driverId: string, name: string) {
    return prisma.class.create({
      data: { driverId, name },
      select: {
        id: true,
        driverId: true,
        name: true,
        createdAt: true,
      },
    });
  },

  listByDriver(driverId: string) {
    return prisma.class.findMany({
      where: { driverId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        driverId: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            students: { where: { active: true } },
          },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        driverId: true,
        name: true,
        createdAt: true,
      },
    });
  },

  findByIdAndDriver(id: string, driverId: string) {
    return prisma.class.findFirst({
      where: { id, driverId },
      select: {
        id: true,
        driverId: true,
        name: true,
        createdAt: true,
      },
    });
  },

  update(id: string, name: string) {
    return prisma.class.update({
      where: { id },
      data: { name },
      select: {
        id: true,
        driverId: true,
        name: true,
        createdAt: true,
      },
    });
  },

  delete(id: string) {
    return prisma.class.delete({
      where: { id },
    });
  },

  countByDriver(driverId: string) {
    return prisma.class.count({
      where: { driverId },
    });
  },

  countActiveStudents(classId: string) {
    return prisma.student.count({
      where: { classId, active: true },
    });
  },
};
