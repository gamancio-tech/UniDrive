import { prisma } from "../lib/prisma";


export const adminRepository = {
  async createAdmin (name: string, email: string, passwordHash: string){
    return prisma.admin.create({
      data: {
        name,
        email,
        passwordHash
      }
    });
  },
  async findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.admin.findUnique({ where: { id } });
  },

  async listAdmins() {
    return prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isSuperAdmin: true,
        createdAt: true,
      },
      orderBy: [
        { isSuperAdmin: "desc" },
        { createdAt: "desc" },
      ],
    });
  },

  async deleteAdmin(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.pushSubscription.deleteMany({
        where: { adminId: id },
      });

      return tx.admin.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          isSuperAdmin: true,
        },
      });
    });
  },
};
